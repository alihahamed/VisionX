import { useRef, useState, useEffect, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Landmark indices
const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const NOSE_TIP = 1;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;

// Eye aspect ratio landmarks (6 points per eye)
const LEFT_EYE_PTS = [33, 133, 160, 159, 158, 157]; // inner, outer, top, bottom
const RIGHT_EYE_PTS = [362, 263, 385, 386, 387, 388];
const EYE_AR_THRESHOLD = 0.16; // below this = eye closed
const EYE_AR_OPEN_THRESHOLD = 0.205; // above this = clearly open
const GAZE_THRESHOLD = 0.95; // relaxed - allows camera/screen gaze variance
const FACE_MARGIN = 0.02;
const FACE_MIN_WIDTH = 0.16;
const FACE_MIN_HEIGHT = 0.12;
const EYE_MIN_WIDTH = 0.015;
const IRIS_MIN_RADIUS_RATIO = 0.04;
const IRIS_MAX_RADIUS_RATIO = 0.42;
const MIN_FRAMES_FOR_VALID = 8;
const ANALYSIS_INTERVAL_MS = 50; // 20 FPS
const YAW_WINDOW_SIZE = 20;
const ENGAGEMENT_THRESHOLD = 0.05;
const METRICS_WINDOW_SEC = 3; // sliding window for live metrics — fast reaction
const YAW_EXTREME_THRESHOLD = 0.62; // face-relative normalized yaw threshold

// Relevant blendshape names for engagement detection
const ENGAGEMENT_BLENDSHAPES = [
  "browInnerUp",
  "mouthSmileLeft",
  "mouthSmileRight",
  "jawOpen",
  "eyeSquintLeft",
  "eyeSquintRight",
];

function avg(points, axis) {
  return points.reduce((sum, p) => sum + p[axis], 0) / points.length;
}

function dist2d(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function variance(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
}

/**
 * Compute eye aspect ratio (EAR) - detects closed eyes.
 * EAR = (vertical distances) / horizontal distance
 * Drops significantly when eye closes.
 */
function computeEyeAspectRatio(landmarks, eyePts) {
  // Horizontal: inner to outer corner
  const horizontal = dist2d(landmarks[eyePts[0]], landmarks[eyePts[1]]);

  // Vertical: top to bottom (two pairs for stability)
  const v1 = dist2d(landmarks[eyePts[2]], landmarks[eyePts[3]]);
  const v2 = dist2d(landmarks[eyePts[4]], landmarks[eyePts[5]]);

  if (horizontal < 0.001) return 0;

  return (v1 + v2) / (2 * horizontal);
}

/**
 * Check if face is centered enough in frame.
 * Uses nose tip as center reference.
 */
function isFaceInFrame(landmarks) {
  const nose = landmarks[NOSE_TIP];
  const leftEar = landmarks[LEFT_EAR];
  const rightEar = landmarks[RIGHT_EAR];
  if (!nose || !leftEar || !rightEar) return false;

  const xs = landmarks.map((p) => p.x);
  const ys = landmarks.map((p) => p.y);
  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(1, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(1, Math.max(...ys));

  const faceCenterX = (minX + maxX) / 2;
  const faceCenterY = (minY + maxY) / 2;
  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;

  // Face valid if reasonably visible + centered
  return (
    nose.x > FACE_MARGIN && nose.x < 1 - FACE_MARGIN &&
    nose.y > FACE_MARGIN && nose.y < 1 - FACE_MARGIN &&
    faceCenterX > FACE_MARGIN && faceCenterX < 1 - FACE_MARGIN &&
    faceCenterY > FACE_MARGIN && faceCenterY < 1 - FACE_MARGIN &&
    faceWidth >= FACE_MIN_WIDTH &&
    faceHeight >= FACE_MIN_HEIGHT
  );
}

/**
 * Compute eye state + gaze quality for single eye.
 */
function getEyeSignal(landmarks, irisIndices, innerIdx, outerIdx, eyePts) {
  const ear = computeEyeAspectRatio(landmarks, eyePts);
  const clearlyClosed = ear < EYE_AR_THRESHOLD;
  const semiClosed = ear < EYE_AR_OPEN_THRESHOLD;
  const eyeOpen = !semiClosed;

  const irisPoints = irisIndices.map((i) => landmarks[i]);
  const irisCenterX = avg(irisPoints, "x");
  const irisCenterY = avg(irisPoints, "y");

  const inner = landmarks[innerIdx];
  const outer = landmarks[outerIdx];

  const eyeCenterX = (inner.x + outer.x) / 2;
  const eyeCenterY = (inner.y + outer.y) / 2;
  const eyeWidth = dist2d(inner, outer);

  if (eyeWidth < EYE_MIN_WIDTH) {
    return { valid: false, open: eyeOpen, centered: false, quality: 0, closed: clearlyClosed, occluded: false, ear };
  }

  const displacement =
    Math.sqrt((irisCenterX - eyeCenterX) ** 2 + (irisCenterY - eyeCenterY) ** 2) /
    (eyeWidth / 2);

  const irisRadius = avg(irisPoints.map((p) => dist2d(p, { x: irisCenterX, y: irisCenterY })));
  const irisRatio = irisRadius / eyeWidth;
  const irisLikelyVisible = irisRatio > IRIS_MIN_RADIUS_RATIO && irisRatio < IRIS_MAX_RADIUS_RATIO;
  const occluded = !irisLikelyVisible && !clearlyClosed;
  const centered = displacement < GAZE_THRESHOLD;
  const quality = occluded ? 0 : Math.max(0, 1 - displacement / GAZE_THRESHOLD);

  return {
    valid: irisLikelyVisible || clearlyClosed,
    open: eyeOpen,
    centered,
    quality,
    closed: clearlyClosed,
    occluded,
    ear,
  };
}

/**
 * Compute head yaw from nose and ear landmarks.
 */
function computeYaw(landmarks) {
  const nose = landmarks[NOSE_TIP];
  const leftEar = landmarks[LEFT_EAR];
  const rightEar = landmarks[RIGHT_EAR];
  if (!nose || !leftEar || !rightEar) return 0;

  // Use normalized horizontal offset (2D) instead of atan2(x,z):
  // z is noisy/near-zero on many webcams -> false "extreme turn".
  const midX = (leftEar.x + rightEar.x) / 2;
  const faceWidth = Math.max(0.001, Math.abs(rightEar.x - leftEar.x));
  return (nose.x - midX) / (faceWidth / 2);
}

/**
 * Compute engagement score from blendshapes.
 */
function computeEngagement(blendshapes) {
  if (!blendshapes || !blendshapes.length) return 0;

  const categories = blendshapes[0]?.categories || [];
  if (!categories.length) return 0;

  let total = 0;
  let count = 0;

  for (const cat of categories) {
    if (ENGAGEMENT_BLENDSHAPES.includes(cat.categoryName)) {
      total += cat.score;
      count++;
    }
  }

  return count > 0 ? total / count : 0;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function useFaceAnalysis(videoRef, active) {
  const landmarkerRef = useRef(null);
  const intervalRef = useRef(null);
  const accumulatorRef = useRef({
    totalFrames: 0,
    eyeContactFrames: 0,
    engagedFrames: 0,
    yawHistory: [],
    noFaceFrames: 0,
  });

  const [liveMetrics, setLiveMetrics] = useState(null);
  const [ready, setReady] = useState(false);
  const frameHistoryRef = useRef([]); // { timestamp, eyeContact, engaged, yaw }
  const smoothedMetricsRef = useRef({ eyeContact: 50, headStability: 50, engagement: 50 });
  const SMOOTHING_ALPHA = 0.25; // 25% new sample, 75% history — responsive but not jittery

  // Initialize FaceLandmarker
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });

        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setReady(true);
          console.log("✅ FaceLandmarker initialized");
        }
      } catch (err) {
        console.warn("⚠️ FaceLandmarker init failed:", err.message);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Reset accumulators when active transitions
  useEffect(() => {
    if (active) {
      accumulatorRef.current = {
        totalFrames: 0,
        eyeContactFrames: 0,
        engagedFrames: 0,
        yawHistory: [],
        noFaceFrames: 0,
      };
      frameHistoryRef.current = [];
      smoothedMetricsRef.current = { eyeContact: 50, headStability: 50, engagement: 50 };
    }
  }, [active]);

  // Frame processing loop
  useEffect(() => {
    if (!active || !ready) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const processFrame = () => {
      // Skip if tab is hidden
      if (document.hidden) return;

      const video = videoRef?.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker) return;
      if (video.readyState < 2) return; // video not ready
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      try {
        const result = landmarker.detectForVideo(video, performance.now());

        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
          accumulatorRef.current.noFaceFrames++;
          const now = performance.now();
          frameHistoryRef.current.push({
            timestamp: now,
            eyeContact: 0,
            engaged: 0,
            yaw: 0,
            faceVisible: false,
          });
          const cutoff = now - (METRICS_WINDOW_SEC * 1000);
          frameHistoryRef.current = frameHistoryRef.current.filter((f) => f.timestamp >= cutoff);
          const windowFrames = frameHistoryRef.current;
          if (windowFrames.length >= 3) {
            const rawEyeContact = (windowFrames.reduce((sum, f) => sum + (f.eyeContact || 0), 0) / windowFrames.length) * 100;
            const rawEngagement = (windowFrames.filter((f) => f.engaged).length / windowFrames.length) * 100;
            smoothedMetricsRef.current = {
              eyeContact: smoothedMetricsRef.current.eyeContact * (1 - SMOOTHING_ALPHA) + rawEyeContact * SMOOTHING_ALPHA,
              headStability: smoothedMetricsRef.current.headStability * (1 - SMOOTHING_ALPHA),
              engagement: smoothedMetricsRef.current.engagement * (1 - SMOOTHING_ALPHA) + rawEngagement * SMOOTHING_ALPHA,
            };
            setLiveMetrics({
              eyeContact: Math.round(smoothedMetricsRef.current.eyeContact),
              headStability: Math.round(smoothedMetricsRef.current.headStability),
              engagement: Math.round(smoothedMetricsRef.current.engagement),
            });
          }
          return; // no face: penalize eye contact
        }

        const landmarks = result.faceLandmarks[0];
        const acc = accumulatorRef.current;
        acc.totalFrames++;

        const now = performance.now();

        // --- Face visibility checks ---
        const faceVisible = isFaceInFrame(landmarks);

        // --- Eye Contact ---
        const leftEye = getEyeSignal(
          landmarks, LEFT_IRIS, LEFT_EYE_INNER, LEFT_EYE_OUTER, LEFT_EYE_PTS
        );
        const rightEye = getEyeSignal(
          landmarks, RIGHT_IRIS, RIGHT_EYE_INNER, RIGHT_EYE_OUTER, RIGHT_EYE_PTS
        );

        // Check extreme head turn (yaw too high = looking away)
        const yaw = computeYaw(landmarks);
        const headTurnedAway = Math.abs(yaw) > YAW_EXTREME_THRESHOLD;

        const bothClosed = leftEye.closed && rightEye.closed;
        const noReliableIris = (!leftEye.valid && !rightEye.valid) || (leftEye.occluded && rightEye.occluded);
        const openEyeScores = [leftEye, rightEye]
          .filter((eye) => eye.valid && eye.open)
          .map((eye) => (eye.centered ? eye.quality : eye.quality * 0.45));
        const eyeQuality = openEyeScores.length
          ? (openEyeScores.reduce((sum, q) => sum + q, 0) / openEyeScores.length)
          : 0;
        const opennessScore = clamp01(
          ((leftEye.ear - EYE_AR_THRESHOLD) + (rightEye.ear - EYE_AR_THRESHOLD)) /
          (2 * (EYE_AR_OPEN_THRESHOLD - EYE_AR_THRESHOLD))
        );
        const headFacingScore = clamp01(1 - (Math.abs(yaw) / YAW_EXTREME_THRESHOLD));
        const gazeScore = eyeQuality > 0 ? eyeQuality : (noReliableIris ? opennessScore * 0.35 : 0.5);

        let eyeContactScore = 0;
        if (!faceVisible || headTurnedAway || bothClosed) {
          eyeContactScore = 0;
        } else {
          eyeContactScore = clamp01(
            headFacingScore * 0.4 +
            opennessScore * 0.35 +
            gazeScore * 0.25
          );
        }
        const isEyeContact = eyeContactScore >= 0.42;

        // Debug logging (remove once calibrated)
        if (!isEyeContact) {
          console.log("No eye contact:", {
            faceVisible,
            headTurnedAway,
            leftEye,
            rightEye,
            bothClosed,
            noReliableIris,
            eyeQuality: eyeQuality.toFixed(3),
            opennessScore: opennessScore.toFixed(3),
            eyeContactScore: eyeContactScore.toFixed(3),
            yaw: yaw.toFixed(3),
          });
        }

        if (isEyeContact) {
          acc.eyeContactFrames++;
        }

        // --- Head Stability ---
        acc.yawHistory.push(yaw);
        if (acc.yawHistory.length > YAW_WINDOW_SIZE) {
          acc.yawHistory.shift();
        }

        // --- Engagement ---
        const engScore = computeEngagement(result.faceBlendshapes);
        const isEngaged = engScore > ENGAGEMENT_THRESHOLD && faceVisible;
        if (isEngaged) {
          acc.engagedFrames++;
        }

        // Record to sliding window history
        frameHistoryRef.current.push({
          timestamp: now,
          eyeContact: eyeContactScore,
          engaged: isEngaged ? 1 : 0,
          yaw,
          faceVisible,
        });

        // Prune old frames outside window
        const cutoff = now - (METRICS_WINDOW_SEC * 1000);
        frameHistoryRef.current = frameHistoryRef.current.filter(
          f => f.timestamp >= cutoff
        );

        // --- Compute live metrics from sliding window ---
        const windowFrames = frameHistoryRef.current;
        if (windowFrames.length >= 3) {
          const rawEyeContact = (windowFrames.reduce((sum, f) => sum + (f.eyeContact || 0), 0) / windowFrames.length) * 100;
          const yawVar = variance(windowFrames.map(f => f.yaw));
          const rawHeadStability = Math.max(0, Math.min(100, 100 - yawVar * 6000));
          const rawEngagement = (windowFrames.filter(f => f.engaged).length / windowFrames.length) * 100;

          // Exponential smoothing for responsive but stable display
          smoothedMetricsRef.current = {
            eyeContact: smoothedMetricsRef.current.eyeContact * (1 - SMOOTHING_ALPHA) + rawEyeContact * SMOOTHING_ALPHA,
            headStability: smoothedMetricsRef.current.headStability * (1 - SMOOTHING_ALPHA) + rawHeadStability * SMOOTHING_ALPHA,
            engagement: smoothedMetricsRef.current.engagement * (1 - SMOOTHING_ALPHA) + rawEngagement * SMOOTHING_ALPHA,
          };

          setLiveMetrics({
            eyeContact: Math.round(smoothedMetricsRef.current.eyeContact),
            headStability: Math.round(smoothedMetricsRef.current.headStability),
            engagement: Math.round(smoothedMetricsRef.current.engagement),
          });
        }
      } catch {
        // Silently handle frame processing errors (resize, context loss, etc.)
      }
    };

    intervalRef.current = setInterval(processFrame, ANALYSIS_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, ready, videoRef]);

  // Compute final presence score
  const getPresenceReport = useCallback(() => {
    const windowFrames = frameHistoryRef.current;

    if (windowFrames.length < MIN_FRAMES_FOR_VALID) {
      return null; // not enough data
    }

    const eyeContact = Math.round(
      (windowFrames.reduce((sum, f) => sum + (f.eyeContact || 0), 0) / windowFrames.length) * 100
    );
    const yawVar = variance(windowFrames.map(f => f.yaw));
    const headStability = Math.round(Math.max(0, Math.min(100, 100 - yawVar * 6000)));
    const engagement = Math.round(
      (windowFrames.filter(f => f.engaged).length / windowFrames.length) * 100
    );

    const presenceScore = Math.round(
      eyeContact * 0.45 + headStability * 0.30 + engagement * 0.25
    );

    return {
      eyeContact,
      headStability,
      engagement,
      presenceScore,
      totalFrames: accumulatorRef.current.totalFrames,
      noFaceFrames: accumulatorRef.current.noFaceFrames,
      windowFrames: windowFrames.length,
    };
  }, []);

  return {
    liveMetrics,
    ready,
    getPresenceReport,
  };
}
