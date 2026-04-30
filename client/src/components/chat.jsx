import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation";
import { useChat } from "../createContext";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import React from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

import { Orb } from "./ui/Orb";
import { Message, MessageContent } from "./ui/message";
import { Card } from "./ui/card";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GlowingEffect } from "./ui/glowing-effect";

import { WavyBackground } from "./ui/wavy-background";
import { HoverBorderGradient } from "./ui/hover-border-gradient";
import { Button } from "./ui/moving-border";
import FloatingLines from "./ui/FloatingLines";
import { Mic, MicOff } from "lucide-react";
import ghost from "../assets/ghost.png";
import PillNav from "./ui/PillNav";
import { VoicePicker } from "./voicePicker";
import { PersonaPicker } from "./personaPicker";
import CodeInterface from "./codeInterface";
import logo from "../assets/intervue-logo.png";
import { useFaceAnalysis } from "../hooks/useFaceAnalysis";

const InterviewBackground = React.memo(() => {
  return (
    <div className="absolute inset-0 z-0">
      <FloatingLines
        enabledWaves={["middle", "bottom"]}
        lineCount={[10, 15, 20]}
        lineDistance={[8, 6, 4]}
        bendRadius={8.0}
        bendStrength={-1}
        interactive={true}
        parallax={false}
        linesGradient={["#1E3A5F", "#2D6A9F", "#5BA4CF", "#B8D9F0"]}
      />
    </div>
  );
});

const CallNav = React.memo(({ onReset }) => {
  return (
    <PillNav
      logo={ghost}
      items={[{ label: "Reset Interview", href: "/" }]}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 call-nav"
      ease="power2.easeOut"
      baseColor="white"
      pillColor="black"
      hoveredPillTextColor="black"
      pillTextColor="white"
      onReset={onReset}
    />
  );
});

// Give it a display name for debugging
InterviewBackground.displayName = "InterviewBackground";
CallNav.displayName = "CallNav";

const ReportView = ({ interviewReport, handleDownloadReport, handleCloseReport }) => {
  const containerRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      containerRef.current,
      { backgroundColor: "rgba(0,0,0,0)" },
      { backgroundColor: "rgba(0,0,0,1)", duration: 0.8, ease: "power2.inOut" }
    )
    .fromTo(
      ".report-content",
      { y: 60, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: "expo.out" },
      "-=0.4"
    )
    .fromTo(
      ".report-header > *",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.6"
    )
    .fromTo(
      ".report-stat",
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: "back.out(1.2)" },
      "-=0.4"
    )
    .fromTo(
      ".report-section",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
      "-=0.2"
    );

    // Presence score bar animation
    if (interviewReport?.presence) {
      tl.fromTo(
        ".report-presence",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
        "-=0.3"
      ).fromTo(
        ".presence-bar-fill",
        { width: "0%" },
        { width: `${interviewReport.presence.presenceScore}%`, duration: 1.2, ease: "power2.out" },
        "-=0.2"
      );
    }
  }, { scope: containerRef });

  if (!interviewReport) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black text-white overflow-y-auto pb-20 font-outfit">
      <div className="report-content max-w-[800px] mx-auto p-8 md:p-14 mt-10 md:mt-16 space-y-10 bg-[#030303] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-zinc-800/10 blur-[100px] pointer-events-none" />

        <div className="report-header flex flex-col md:flex-row items-start justify-between gap-6 border-b border-white/5 pb-10 relative z-10">
          <div>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.3em] mb-4">
              Interview Evaluation Report
            </p>
            <h2 className="text-4xl font-light tracking-tight">
              {interviewReport.candidate.name || "Candidate"} <span className="text-white/30 font-extralight">/ {interviewReport.verdict}</span>
            </h2>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs font-light px-4 py-1.5 bg-white/5 text-slate-300 border border-white/5">
                Overall Score: <span className="font-medium text-white">{interviewReport.overall_score}</span>/100
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadReport}
              className="px-6 py-2.5 bg-white text-black text-xs font-medium tracking-wide hover:bg-zinc-200 transition-colors"
            >
              Download JSON
            </button>
            <button
              onClick={handleCloseReport}
              className="px-6 py-2.5 border border-white/20 text-xs font-medium tracking-wide hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
          {Object.entries(interviewReport.rubric).map(([k, v]) => (
            <div key={k} className="report-stat border border-white/5 p-6 bg-black flex flex-col justify-between h-32 hover:border-white/10 transition-colors duration-500">
              <p className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em]">{k.replaceAll("_", " ")}</p>
              <p className="text-4xl font-extralight">{v}</p>
            </div>
          ))}
        </div>

        {/* Presence & Body Language Section */}
        {interviewReport.presence ? (
          <div className="report-presence border border-white/5 p-8 bg-black hover:border-white/10 transition-colors duration-500 relative z-10 space-y-6">
            <h3 className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em]">Presence & Body Language</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em]">Eye Contact</p>
                <p className="text-3xl font-extralight">{interviewReport.presence.eyeContact}<span className="text-lg text-white/30">%</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em]">Head Stability</p>
                <p className="text-3xl font-extralight">{interviewReport.presence.headStability}<span className="text-lg text-white/30">%</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em]">Engagement</p>
                <p className="text-3xl font-extralight">{interviewReport.presence.engagement}<span className="text-lg text-white/30">%</span></p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em]">Composite Presence Score</span>
                <span className="text-sm font-light text-white">{interviewReport.presence.presenceScore}/100</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "presence-bar-fill h-full rounded-full transition-colors",
                    interviewReport.presence.presenceScore >= 70 ? "bg-emerald-500" :
                    interviewReport.presence.presenceScore >= 40 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: 0 }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="report-presence border border-white/5 p-8 bg-black relative z-10">
            <h3 className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em] mb-4">Presence & Body Language</h3>
            <p className="text-slate-600 text-sm font-light">Camera data unavailable for this session.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div className="report-section border border-white/5 p-8 bg-black hover:border-white/10 transition-colors duration-500">
            <h3 className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em] mb-6">Strengths</h3>
            <ul className="space-y-4">
              {interviewReport.strengths.map((s, i) => (
                <li key={i} className="flex gap-4 text-slate-300 text-sm font-light leading-relaxed">
                  <span className="text-emerald-500/50 mt-1 text-[10px]">■</span> <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="report-section border border-white/5 p-8 bg-black hover:border-white/10 transition-colors duration-500">
            <h3 className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em] mb-6">Gaps</h3>
            <ul className="space-y-4">
              {interviewReport.gaps.map((g, i) => (
                <li key={i} className="flex gap-4 text-slate-300 text-sm font-light leading-relaxed">
                  <span className="text-rose-500/50 mt-1 text-[10px]">■</span> <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="report-section border border-white/5 p-8 bg-black hover:border-white/10 transition-colors duration-500 relative z-10">
          <h3 className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em] mb-6">Summary</h3>
          <p className="text-slate-300 font-light text-[15px] leading-relaxed max-w-3xl">
            {interviewReport.final_summary}
          </p>
        </div>

        <div className="report-section border border-white/5 p-8 bg-black hover:border-white/10 transition-colors duration-500 relative z-10">
          <h3 className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em] mb-6">Next Steps</h3>
          <ul className="space-y-4 text-slate-300 font-light text-[15px]">
            {interviewReport.next_steps.map((step, i) => (
              <li key={i} className="flex gap-4 leading-relaxed">
                <span className="text-white/20 mt-1 text-[10px]">■</span> <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const API_BASE = import.meta.env.VITE_API_URL || "";

function ChatConversation() {
  const {
    addMessage,
    message,
    isProcessing,
    setIsProcessing,
    handleOptionUpdate,
    survey,
    deleteMessage,
    setCodingMode,
    codingMode,
    resetInterview,
    interview,
    resettingMode,
  } = useChat();

  // gsap animations

  gsap.registerPlugin(SplitText);

  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef();
  const splitRef = useRef(null);
  const tlRef = useRef(null);
  const tlBtn = useRef(null);
  const callContainerRef = useRef(null);
  const buttonRef = useRef(null);
  const [isResetting, setIsResetting] = useState(false);
  const mainContainerRef = useRef(null);

  // component mount animation when page loads

  useGSAP(() => {
    const heroSplit = new SplitText(".heroText span", {
      type: "chars,  words",
    });

    gsap.from(heroSplit.chars, {
      opacity: 0,
      duration: 1.5,
      ease: "expo.out",
      stagger: 0.08,
      alpha: 0,
      y: 30,
    });

    SplitText.create(".subtitleText", {
      type: "lines",
      onSplit(self) {
        gsap.from(self.lines, {
          opacity: 0,
          yPercent: 100,
          duration: 1.8,
          ease: "expo.out",
          stagger: 0.05,
          delay: 2,
        });
      },
    });

    gsap.fromTo(
      ".techPills > *",
      {
        opacity: 0,
        scale: 0,
        y: 30,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 2.7,
        clearProps: "all",
      }
    );

    tlBtn.current = gsap.timeline({
      delay: 3.6,
    });

    tlBtn.current.set([".btn-text-1", ".btn-text-2"], {
      opacity: 0,
    });

    tlBtn.current.fromTo(
      ".pop-btn",
      {
        width: "48px",
        borderRadius: "50%",
        scale: 0,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)",
      }
    );

    tlBtn.current
      .to(".pop-btn", {
        width: "12rem",
        borderRadius: "1.75rem",
        color: "white",
        duration: 1.0,
        ease: "power3.inOut",
        delay: 0.5,
        clearProps: "all",
      })
      .to(
        [".btn-text-1", ".btn-text-2"],
        {
          opacity: 1,
          duration: 0.6,
          clearProps: "all",
        },
        "<+=0.3"
      );
  }, []);

  // useGSAP for button rolling animation

  useGSAP(() => {
    const split1 = new SplitText(".btn-text-1", { type: "words, chars" });
    const split2 = new SplitText(".btn-text-2", { type: "words, chars" });

    tlRef.current = gsap.timeline({ paused: true });

    tlRef.current.fromTo(
      split1.chars,
      {
        y: 0,
      },
      {
        duration: 0.5,
        y: -20,
        stagger: 0.04,
      }
    );

    tlRef.current.fromTo(
      split2.chars,
      {
        y: 38,
      },
      {
        duration: 0.4,
        y: -20,
        stagger: 0.03,
      },
      "<"
    );
  }, [isHovered]);

  // useGSAP for pushing the hero text, sub text and the pills up when the chat card appears

  useGSAP(() => {
    if (!isProcessing && !survey.isCompleted) return;

    const tl = gsap.timeline();

    // 1. Clean Exit for Hero Elements
    tl.to([".heroText", ".subtitleText", ".techPills", ".pop-btn"], {
      y: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.inOut",
      display: "none",
    });

    // 2. The "Premium Pop" Reveal
    tl.fromTo(
      ".chat-card-container",
      {
        y: 100, // Lower starting point for more travel
        scale: 0.86, // Subtle scale-up feels more professional
        opacity: 0,
        rotationX: 25, // Slight 3D tilt
        transformOrigin: "center bottom",
        filter: "blur(20px) brightness(2)", // Start "glowing" and blurred
      },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        rotationX: 0,
        filter: "blur(0px) brightness(1)",
        duration: 1.8,
        // 'back.out(1.4)' gives a tiny overshoot that feels like physical weight
        ease: "back.out(1.4)",
        clearProps: "transform,filter", // Clean up to allow hover effects later
      },
      "-=0.3" // Overlap with text exit
    );
  }, [survey.isCompleted]);

  // gsap animation for the floating orb

  useGSAP(() => {
    gsap.to(".orb-ref", {
      y: -20,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }, []);

  // gsap animations for call control buttons

  const [callEnd, setCallEnd] = useState(true);

  const { contextSafe } = useGSAP(
    () => {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 1, ease: "back.out(1.7)" }
      );
    },
    { dependencies: [callEnd], scope: callContainerRef }
  );

  const onEnter = contextSafe(() => {});

  // voice call refs and states

  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [orbState, setOrbState] = useState("listening");

  const [isMuted, setIsMuted] = useState(false);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const workletNodeRef = useRef(null);
  const nextStartTimeRef = useRef(null);
  const playbackSourcesRef = useRef(new Set());
  const playbackGenerationRef = useRef(0);
  const outboundAudioMutedRef = useRef(true);
  const silentMonitorRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const [selectedVoice, setSelectedVoice] = useState("aura-2-thalia-en");
  const [selectedPersona, setSelectedPersona] = useState("balanced");

  // Face analysis hook — tracks eye contact, head stability, engagement while call is active
  const { liveMetrics, getPresenceReport } = useFaceAnalysis(videoRef, !callEnd);
  const [codeTask, setCodeTask] = useState({
    title: "Coding Challenge",
    prompt: "Implement requested function. Handle edge cases.",
    language: "JavaScript",
    starterCode: "",
    difficulty: "adaptive",
  });
  const [codingSession, setCodingSession] = useState({
    active: false,
    attemptsUsed: 0,
    maxAttempts: 3,
    lastHint: "",
    status: "idle", // idle | awaiting_evaluation | pass | fail | final_fail
  });
  const [liveSubtitle, setLiveSubtitle] = useState("");
  const [interviewReport, setInterviewReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const thinkFallbackSentRef = useRef(false);
  const orbRef = useRef(null);
  const voiceSessionIdRef = useRef(
    (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
      `session-${Date.now()}`
  );
  const telemetryRef = useRef({
    turnId: null,
    marks: {
      t_mic: null,
      t_stt_partial: null,
      t_first_token: null,
      t_first_audio: null,
    },
  });
  const pendingInterviewEndRef = useRef(false);
  const reportFinalizeTimerRef = useRef(null);

  // FIX: Track messages in a Ref so we can read them without re-triggering effects
  const messagesRef = useRef(message);
  useEffect(() => {
    messagesRef.current = message;
  }, [message]);

  useEffect(() => {
    outboundAudioMutedRef.current = isMuted;
  }, [isMuted]);

  const handleMuteToggle = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    outboundAudioMutedRef.current = nextMuted;

    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  }, [isMuted]);

  const nowMs = () => performance.now();

  const postVoiceTelemetry = useCallback(async () => {
    const payload = telemetryRef.current;
    if (!payload?.turnId) return;
    const marks = payload.marks || {};
    const hasAnyMark =
      marks.t_mic != null ||
      marks.t_stt_partial != null ||
      marks.t_first_token != null ||
      marks.t_first_audio != null;
    if (!hasAnyMark) return;

    try {
      await fetch(`${API_BASE}/api/voice-telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: voiceSessionIdRef.current,
          turnId: payload.turnId,
          marks: payload.marks,
        }),
      });
    } catch (error) {
      console.warn("Telemetry post failed", error);
    }
  }, []);

  const startNewTelemetryTurn = useCallback(() => {
    telemetryRef.current = {
      turnId:
        (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
        `turn-${Date.now()}`,
      marks: {
        t_mic: null,
        t_stt_partial: null,
        t_first_token: null,
        t_first_audio: null,
      },
    };
  }, []);

  const openCodingMode = useCallback((taskPatch = {}) => {
    setCodeTask((prev) => ({
      ...prev,
      ...taskPatch,
      title: taskPatch.title || prev.title || "Coding Challenge",
      prompt:
        taskPatch.prompt ||
        prev.prompt ||
        "Implement requested function. Handle edge cases.",
    }));
    setCodingSession({
      active: true,
      attemptsUsed: 0,
      maxAttempts: 3,
      lastHint: "",
      status: "idle",
    });
    setCodingMode(true);
  }, [setCodingMode]);

  const closeCodingMode = useCallback(() => {
    setCodingMode(false);
    setCodingSession((prev) => ({
      ...prev,
      active: false,
      status: "idle",
    }));
  }, [setCodingMode]);

  const applyCodeReviewResult = useCallback((resultPayload = {}) => {
    const normalized = (resultPayload.result || "").toUpperCase();
    if (normalized === "PASS") {
      setCodingSession((prev) => ({
        ...prev,
        status: "pass",
        lastHint: "",
      }));
      closeCodingMode();
      return;
    }

    if (normalized === "FINAL_FAIL") {
      setCodingSession((prev) => ({
        ...prev,
        status: "final_fail",
        lastHint: resultPayload.hint || resultPayload.solution || prev.lastHint,
        active: false,
      }));
      closeCodingMode();
      return;
    }

    const shouldClose = codingSession.attemptsUsed >= codingSession.maxAttempts;
    setCodingSession((prev) => ({
      ...prev,
      status: shouldClose ? "final_fail" : "fail",
      lastHint: resultPayload.hint || prev.lastHint,
      active: !shouldClose,
    }));

    if (shouldClose) {
      closeCodingMode();
      if (socketRef.current?.readyState === 1) {
        socketRef.current.send(
          JSON.stringify({
            type: "InjectUserMessage",
            content:
              "Candidate has exhausted all coding attempts. Give a brief wrap-up, share concise ideal approach, then say: let's move ahead.",
          })
        );
      }
    }
  }, [closeCodingMode, codingSession.attemptsUsed, codingSession.maxAttempts]);

  const parseCodeReviewSignal = (content) => {
    if (typeof content !== "string") return null;
    const match = content.match(
      /\[\[CODE_REVIEW:(PASS|FAIL|FINAL_FAIL)(?:\|HINT:([\s\S]*?))?(?:\|SOLUTION:([\s\S]*?))?\]\]/i
    );
    if (!match) return null;
    return {
      raw: match[0],
      result: match[1]?.toUpperCase(),
      hint: (match[2] || "").trim(),
      solution: (match[3] || "").trim(),
      cleaned: content.replace(match[0], "").trim(),
    };
  };

  const normalizeReport = (payload = {}) => {
    const rubric = payload.rubric || {};
    return {
      candidate: {
        name: survey?.userName || "",
        role: survey?.targetRole || "",
        stack: survey?.techStack || "",
        experience: survey?.experience || "",
      },
      verdict: payload.verdict || "Pending",
      overall_score:
        typeof payload.overall_score === "number" ? payload.overall_score : 0,
      rubric: {
        fundamentals: rubric.fundamentals ?? 0,
        problem_solving: rubric.problem_solving ?? 0,
        coding: rubric.coding ?? 0,
        system_thinking: rubric.system_thinking ?? 0,
        communication: rubric.communication ?? 0,
        project_depth: rubric.project_depth ?? 0,
      },
      strengths: Array.isArray(payload.strengths) ? payload.strengths : [],
      gaps: Array.isArray(payload.gaps) ? payload.gaps : [],
      evidence: Array.isArray(payload.evidence) ? payload.evidence : [],
      next_steps: Array.isArray(payload.next_steps) ? payload.next_steps : [],
      final_summary: payload.final_summary || "",
      generated_at: new Date().toISOString(),
    };
  };

  const stopAgentAudioPlayback = useCallback(() => {
    playbackGenerationRef.current += 1;
    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Source might already be ended/stopped.
      }
    });
    playbackSourcesRef.current.clear();

    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  }, []);

  // --- 1. HELPER: PLAY AUDIO ---
  const playAudio = async (blob) => {
    const playbackGeneration = playbackGenerationRef.current;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)({
        latencyHint: "interactive",
      });
    }
    const audioCtx = audioContextRef.current;
    if (telemetryRef.current.marks.t_first_audio == null) {
      telemetryRef.current.marks.t_first_audio = nowMs();
      postVoiceTelemetry();
    }

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    // 1. Read the Raw Int16 bytes
    const arrayBuffer = await blob.arrayBuffer();
    if (playbackGeneration !== playbackGenerationRef.current) {
      return;
    }
    const int16Data = new Int16Array(arrayBuffer);

    // 2. Convert to Float32 (Standard Browser Format)
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      // Normalize -32768..32767 to -1.0..1.0
      float32Data[i] = int16Data[i] / 32768.0;
    }

    // 3. Create an Audio Buffer
    // 24000 matches your "output.sample_rate" in settings
    const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    // 4. Play it (Queued for smoothness)
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    playbackSourcesRef.current.add(source);

    // Schedule playback to ensure chunks play back-to-back without gaps
    const currentTime = audioCtx.currentTime;
    // If the queue has fallen behind current time, reset it
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }

    source.start(nextStartTimeRef.current);

    // Advance the pointer
    nextStartTimeRef.current += buffer.duration;

    source.onended = () => {
      playbackSourcesRef.current.delete(source);
    };
  };

  // resetting everything back to default so that we can start a new call
  const endCall = useCallback(() => {
    if (reportFinalizeTimerRef.current) {
      clearTimeout(reportFinalizeTimerRef.current);
      reportFinalizeTimerRef.current = null;
    }
    pendingInterviewEndRef.current = false;

    if (socketRef.current) {
      socketRef.current?.close();
      socketRef.current = null;
    }

    if (mediaRecorderRef.current !== "inactive") {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = null;
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (silentMonitorRef.current) {
      silentMonitorRef.current.disconnect();
      silentMonitorRef.current = null;
    }

    stopAgentAudioPlayback();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    nextStartTimeRef.current = 0;

    setConnectionStatus("idle");
    setOrbState("listening");

    postVoiceTelemetry();
    deleteMessage();
    setCallEnd(true);
  }, [deleteMessage, postVoiceTelemetry, stopAgentAudioPlayback]);

  const finalizeInterviewUi = useCallback(() => {
    if (!pendingInterviewEndRef.current) return;
    pendingInterviewEndRef.current = false;
    if (reportFinalizeTimerRef.current) {
      clearTimeout(reportFinalizeTimerRef.current);
      reportFinalizeTimerRef.current = null;
    }
    endCall();
    setShowReport(true);
  }, [endCall]);

  let isMounted = true;

  const startAgent = async () => {
    try {
      setConnectionStatus("connecting");
      setCallEnd(false);
      setIsMuted(false);
      outboundAudioMutedRef.current = false;
      setShowReport(false);
      pendingInterviewEndRef.current = false;
      if (reportFinalizeTimerRef.current) {
        clearTimeout(reportFinalizeTimerRef.current);
        reportFinalizeTimerRef.current = null;
      }
      console.log(" Starting Agent Connection...");
      console.log(callEnd);

       // fetch instructions (RAG questions/answer data) and token response for verification for deepgram
      const [instructionsResponse, tokenResponse] = await Promise.all([
        fetch(`${API_BASE}/api/get-voice-context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyData: { ...survey, persona: selectedPersona },
            sessionId: voiceSessionIdRef.current,
          }),
        }),
        fetch(`${API_BASE}/api/get-agent-token`),
      ]);

      const { instructions } = await instructionsResponse.json();
      const { key } = await tokenResponse.json();

      // make history context by mapping the messages to type:"History" - we feed this to the deepgram agent for better context
      const historyMessages = messagesRef.current
        .filter((m) => m.sender === "user" || m.sender === "assistant")
        .map((m) => ({
          type: "History",
          role: m.sender === "user" ? "user" : "assistant",
          content: typeof m.text === "string" ? m.text : JSON.stringify(m.text),
        }));

      if (!isMounted) return;

      // creating a websocket connection (socketRef)
      socketRef.current = new WebSocket(
        "wss://agent.deepgram.com/v1/agent/converse",
        ["bearer", key]
      );

      socketRef.current.onerror = (error) =>
        console.error("❌ WebSocket Error:", error);
      socketRef.current.onclose = (event) => {
        console.log(`🔌 Closed: ${event.code} - ${event.reason}`);
        if (isMounted) setConnectionStatus("idle");
      };

      socketRef.current.onopen = async () => {
        if (!isMounted) return;
        console.log("✅ WebSocket Open!");
        setConnectionStatus("active");
        // console.log("history", historyMessages);

        //  Get Mic And Video Stream FIRST to know the Sample Rate
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        streamRef.current = stream;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
        }
        const sampleRate = audioContextRef.current.sampleRate;

        //  Send Settings with LINEAR16 and Dynamic Sample Rate
        const settings = {
          type: "Settings",
          audio: {
            input: {
              encoding: "linear16",
              sample_rate: sampleRate,
            },
            output: {
              encoding: "linear16",
              sample_rate: 24000,
              container: "none",
            },
          },
          agent: {
            listen: {
              provider: {
                type: "deepgram",
                model: "flux-general-en",
                version: "v2",
                eot_threshold: 0.65,
                eager_eot_threshold: 0.4,
              },
            },
            think: {
              provider: { type: "open_ai", model: "gpt-4o-mini" },
              prompt: instructions,
              functions: [
                {
                  name: "enable_coding_mode",
                  description:
                    "Open coding UI before asking coding task. Use during interview when needed.",
                  parameters: {
                    type: "object",
                    properties: {
                      challenge_title: { type: "string" },
                      prompt: { type: "string" },
                      language: { type: "string" },
                      difficulty: { type: "string" },
                      starter_code: { type: "string" },
                    },
                    required: ["prompt"],
                  },
                },
                {
                  name: "code_review_result",
                  description:
                    "Report coding evaluation result after candidate submits solution. Use for pass/fail/hints and attempt flow.",
                  parameters: {
                    type: "object",
                    properties: {
                      result: { type: "string" }, // PASS | FAIL | FINAL_FAIL
                      hint: { type: "string" },
                      solution: { type: "string" },
                    },
                    required: ["result"],
                  },
                },
                {
                  name: "finalize_interview_report",
                  description:
                    "Create final structured evaluation report when interview is complete.",
                  parameters: {
                    type: "object",
                    properties: {
                      verdict: { type: "string" },
                      overall_score: { type: "number" },
                      rubric: {
                        type: "object",
                        properties: {
                          fundamentals: { type: "number" },
                          problem_solving: { type: "number" },
                          coding: { type: "number" },
                          system_thinking: { type: "number" },
                          communication: { type: "number" },
                          project_depth: { type: "number" },
                        },
                      },
                      strengths: { type: "array", items: { type: "string" } },
                      gaps: { type: "array", items: { type: "string" } },
                      evidence: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            area: { type: "string" },
                            note: { type: "string" },
                            impact: { type: "string" },
                          },
                        },
                      },
                      next_steps: { type: "array", items: { type: "string" } },
                      final_summary: { type: "string" },
                    },
                    required: ["verdict", "overall_score", "final_summary"],
                  },
                },
                {
                  name: "end_interview",
                  description:
                    "End interview session after report is ready and move UI to report screen.",
                  parameters: {
                    type: "object",
                    properties: {
                      closing_message: { type: "string" },
                    },
                  },
                },
              ],
            },
            speak: {
              provider: { type: "deepgram", model: selectedVoice },
            },
            context: { messages: historyMessages },
          },
        };
        socketRef.current.send(JSON.stringify(settings));
        //  Setup Audio Processing (Raw PCM)
        const source = audioContextRef.current.createMediaStreamSource(stream);
        startNewTelemetryTurn();
        const silentGain = audioContextRef.current.createGain();
        silentGain.gain.value = 0;
        silentMonitorRef.current = silentGain;
        silentGain.connect(audioContextRef.current.destination);

        const sendPcmChunk = (inputData) => {
          if (outboundAudioMutedRef.current) return;
          if (socketRef.current?.readyState !== 1) return;
          if (telemetryRef.current.marks.t_mic == null) {
            telemetryRef.current.marks.t_mic = nowMs();
          }
          const buffer = new ArrayBuffer(inputData.length * 2);
          const view = new DataView(buffer);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          }
          socketRef.current.send(buffer);
        };

        let workletReady = false;
        try {
          await audioContextRef.current.audioWorklet.addModule(
            "/worklets/pcm-capture-processor.js"
          );
          const workletNode = new AudioWorkletNode(
            audioContextRef.current,
            "pcm-capture-processor",
            { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 }
          );
          workletNodeRef.current = workletNode;
          source.connect(workletNode);
          workletNode.connect(silentGain);
          workletNode.port.onmessage = (event) => {
            if (!(event.data instanceof Float32Array)) return;
            sendPcmChunk(event.data);
          };
          workletReady = true;
        } catch (workletError) {
          console.warn(
            "AudioWorklet unavailable, falling back to ScriptProcessor",
            workletError
          );
        }

        if (!workletReady) {
          const processor = audioContextRef.current.createScriptProcessor(
            1024,
            1,
            1
          );
          processorRef.current = processor;
          source.connect(processor);
          processor.connect(silentGain);
          processor.onaudioprocess = (e) => {
            sendPcmChunk(e.inputBuffer.getChannelData(0));
          };
        };
      };

      //  Handle Messages
      socketRef.current.onmessage = async (message) => {
        // 'message' is the Event Object from the browser, 'message.data' is the actual payload from deepgram (writing so i dont get confused later)
        if (message.data instanceof Blob) {
          playAudio(message.data);
          setOrbState("talking");
          // console.log("blob data", message.data)
          // console.log(orbState);
        } else {
          const event = JSON.parse(message.data);
          // console.log("event", event);

          if (event.type === "FunctionCallRequest") {
            // Process ALL functions in the batch (AI may send multiple in one message)
            const functions = event.functions || [];
            for (const call of functions) {

            if (call.name === "enable_coding_mode") {
              let parsedArgs = {};
              try {
                parsedArgs = call.arguments ? JSON.parse(call.arguments) : {};
              } catch {
                parsedArgs = {};
              }
              const nextTask = {
                title: parsedArgs.challenge_title || "Coding Challenge",
                prompt:
                  parsedArgs.prompt ||
                  "Implement requested function. Handle edge cases.",
                language: parsedArgs.language || "JavaScript",
                starterCode: parsedArgs.starter_code || "",
                difficulty: parsedArgs.difficulty || "adaptive",
              };
              openCodingMode(nextTask);
              const response = {
                type: "FunctionCallResponse",
                id: call.id,
                name: call.name,
                content: JSON.stringify({
                  status: "ok",
                  ui: "coding_mode_opened",
                  challenge: nextTask.title,
                  language: nextTask.language,
                }),
              };
              socketRef.current?.send(JSON.stringify(response));
            }

            if (call.name === "code_review_result") {
              let parsedArgs = {};
              try {
                parsedArgs = call.arguments ? JSON.parse(call.arguments) : {};
              } catch {
                parsedArgs = {};
              }
              applyCodeReviewResult(parsedArgs);
              const response = {
                type: "FunctionCallResponse",
                id: call.id,
                name: call.name,
                content: JSON.stringify({ status: "ok" }),
              };
              socketRef.current?.send(JSON.stringify(response));
            }

            if (call.name === "finalize_interview_report") {
              let parsedArgs = {};
              try {
                parsedArgs = call.arguments ? JSON.parse(call.arguments) : {};
              } catch {
                parsedArgs = {};
              }
              const report = normalizeReport(parsedArgs);

              // Merge presence/body language data from face analysis
              const presenceData = getPresenceReport();
              if (presenceData) {
                report.presence = presenceData;
              }

              setInterviewReport(report);
              try {
                localStorage.setItem("lastInterviewReport", JSON.stringify(report));
              } catch {}
              const response = {
                type: "FunctionCallResponse",
                id: call.id,
                name: call.name,
                content: JSON.stringify({ status: "ok", report_ready: true }),
              };
              socketRef.current?.send(JSON.stringify(response));
            }

            if (call.name === "end_interview") {
              let parsedArgs = {};
              try {
                parsedArgs = call.arguments ? JSON.parse(call.arguments) : {};
              } catch {
                parsedArgs = {};
              }
              const response = {
                type: "FunctionCallResponse",
                id: call.id,
                name: call.name,
                content: JSON.stringify({ status: "ok", ui: "report_opened" }),
              };
              socketRef.current?.send(JSON.stringify(response));

              const closing = parsedArgs?.closing_message || "Interview complete. Opening your report now.";
              pendingInterviewEndRef.current = true;
              if (socketRef.current?.readyState === 1) {
                socketRef.current.send(
                  JSON.stringify({ type: "InjectUserMessage", content: `Wrap up now in one short natural closing line: "${closing}".` })
                );
              }
              reportFinalizeTimerRef.current = setTimeout(() => {
                finalizeInterviewUi();
              }, 4500);
            }

            } // end for loop
          }

          if (event.type === "FunctionCallResponse" && event.name === "enable_coding_mode") {
            let responseTask = {};
            try {
              const parsedContent = event.content ? JSON.parse(event.content) : {};
              responseTask = {
                title: parsedContent.challenge || "Coding Challenge",
                language: parsedContent.language || "JavaScript",
              };
            } catch {
              responseTask = {};
            }
            if (!codingSession.active) {
              openCodingMode(responseTask);
            }
          }

          if (event.type === "Error") {
            console.error("DEEPGRAM ERROR:", event);
            if (
              event?.code === "FAILED_TO_THINK" &&
              !thinkFallbackSentRef.current &&
              socketRef.current?.readyState === 1
            ) {
              thinkFallbackSentRef.current = true;
              const fallbackSettings = {
                type: "Settings",
                agent: {
                  think: {
                    provider: { type: "open_ai", model: "gpt-4o-mini" },
                    prompt:
                      "You are a concise technical interviewer. Ask one short question at a time. Keep replies under 3 sentences.",
                  },
                },
              };
              socketRef.current.send(JSON.stringify(fallbackSettings));
            }
          }
          if (event.type === "AgentThinking") {
            if (telemetryRef.current.marks.t_first_token == null) {
              telemetryRef.current.marks.t_first_token = nowMs();
              postVoiceTelemetry();
            }
          }

          if (event.type === "ConversationText") {
            if (
              event.role === "user" &&
              telemetryRef.current.marks.t_stt_partial == null
            ) {
              telemetryRef.current.marks.t_stt_partial = nowMs();
              postVoiceTelemetry();
            }
            if (
              event.role !== "user" &&
              telemetryRef.current.marks.t_first_token == null
            ) {
              telemetryRef.current.marks.t_first_token = nowMs();
              postVoiceTelemetry();
            }
            const reviewSignal =
              event.role === "assistant" ? parseCodeReviewSignal(event.content) : null;
            const cleanedContent = reviewSignal?.cleaned || event.content;

            const isSystemInjected =
              cleanedContent?.startsWith("Wrap up now") ||
              cleanedContent?.startsWith("Candidate has exhausted") ||
              cleanedContent?.startsWith("Candidate exhausted") ||
              cleanedContent?.startsWith("Code submission attempt");

            if (!isSystemInjected) {
              addMessage(
                event.role === "user" ? "user" : "assistant",
                cleanedContent
              );
              setLiveSubtitle(cleanedContent || "");
            }

            if (event.role === "assistant") {
              const lowerContent = (cleanedContent || "").toLowerCase();
              const looksLikeCodingPrompt =
                lowerContent.includes("write a function") ||
                lowerContent.includes("implement") ||
                lowerContent.includes("solve this") ||
                lowerContent.includes("coding challenge");

              if (looksLikeCodingPrompt && !codingSession.active) {
                openCodingMode({
                  prompt: cleanedContent,
                  title: "Coding Challenge",
                });
              }

              // Backward compatibility if model still emits inline tags.
              if (reviewSignal && codingSession.active) {
                applyCodeReviewResult(reviewSignal);
              }
            }
            //  console.log("text daata", message);
          }
          if (event.type === "UserStartedSpeaking") {
            if (telemetryRef.current.marks.t_mic == null) {
              telemetryRef.current.marks.t_mic = nowMs();
            }
            stopAgentAudioPlayback();
            startNewTelemetryTurn();
            setOrbState("listening");
          }
          if (event.type === "AgentAudioDone") {
            postVoiceTelemetry();
            if (pendingInterviewEndRef.current) {
              finalizeInterviewUi();
            }
          }
        }
      };
    } catch (error) {
      console.error("❌ Setup Error:", error);
      if (isMounted) setConnectionStatus("error");
    }
  };

  const handleCodeSubmit = (codeSnippet) => {
    if (connectionStatus !== "active" || socketRef.current?.readyState !== 1) {
      return {
        ok: false,
        error: "Connection not active. Restart call, then submit.",
      };
    }

    const trimmedCode = (codeSnippet || "").trim();
    if (!trimmedCode) {
      return {
        ok: false,
        error: "Code empty. Write solution first.",
      };
    }

    if (!codingSession.active) {
      return {
        ok: false,
        error: "Coding round not active.",
      };
    }

    if (codingSession.attemptsUsed >= codingSession.maxAttempts) {
      closeCodingMode();
      if (socketRef.current?.readyState === 1) {
        socketRef.current.send(
          JSON.stringify({
            type: "InjectUserMessage",
            content:
              "Candidate exhausted coding attempts. Provide concise correction and say: let's move ahead.",
          })
        );
      }
      return {
        ok: false,
        error: "Max attempts reached. Coding round closed.",
      };
    }

    const nextAttempt = codingSession.attemptsUsed + 1;
    setCodingSession((prev) => ({
      ...prev,
      attemptsUsed: nextAttempt,
      status: "awaiting_evaluation",
    }));

    const response = {
      type: "InjectUserMessage",
      content:
        `Code submission attempt ${nextAttempt}/${codingSession.maxAttempts}.\n` +
        `Challenge: ${codeTask.prompt}\n` +
        `Language: ${codeTask.language}\n` +
        `Candidate code:\n${trimmedCode}\n\n` +
        `Evaluate now. Respond naturally with feedback and one short hint if needed.\n` +
        `Then call function "code_review_result" with:\n` +
        `result = PASS | FAIL | FINAL_FAIL\n` +
        `hint = short hint when FAIL\n` +
        `solution = concise approach when FINAL_FAIL.\n` +
        `Do not speak or display any machine tags.`,
    };

    try {
      socketRef.current.send(JSON.stringify(response));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: `Submission failed: ${error?.message || "unknown error"}`,
      };
    }
  };

  const handleCodeExit = () => {
    closeCodingMode();
  };

  // show the interview interface if survey is completed

  const handleReset = useCallback(() => {
    console.log("🔄 Reset Sequence Initiated");

    // We target the shutters using the main container scope to ensure GSAP finds them
    const tl = gsap.timeline({
      onComplete: () => {
        console.log("✅ Shutters Closed. Triggering State Reset...");

        // 1. End the Call (Media cleanup)
        endCall();

        // 2. Trigger Context Switch
        // This MUST set: resettingMode=true, isProcessing=true, survey.isCompleted=false
        resetInterview();
      },
    });

    // Animate entrance shutters safely
    tl.to(".shutter-top", {
      yPercent: 100,
      duration: 0.8,
      ease: "power3.inOut",
    }).to(
      ".shutter-bottom",
      {
        yPercent: -100,
        duration: 0.8,
        ease: "power3.inOut",
      },
      "<"
    );
  }, [endCall, resetInterview]);

  const handleCloseReport = useCallback(() => {
    setShowReport(false);
  }, []);

  const handleDownloadReport = useCallback(() => {
    if (!interviewReport) return;
    const blob = new Blob([JSON.stringify(interviewReport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [interviewReport]);

  useGSAP(() => {
    if (survey.isCompleted) {
      console.log("removing shutter properties");
      gsap.set([".shutter-top", ".shutter-bottom"], { clearProps: "all" });
    }
  }, [survey.isCompleted]);

  return (
    // 4. MAIN CONTAINER (Replaces Fragment) for GSAP Scoping
    <div ref={mainContainerRef} className="w-full h-full">
      {/* === GLOBAL SHUTTERS (Z-100) === */}
      {/* These exist permanently so they persist across the state change */}
      <div className="fixed inset-0 w-full h-full z-100 pointer-events-none flex flex-col">
        <div className="shutter-top w-full h-1/2 bg-white -translate-y-full will-change-transform" />
        <div className="shutter-bottom w-full h-1/2 bg-white translate-y-full will-change-transform" />
      </div>

      {survey.isCompleted ? (
        <>
          {showReport && interviewReport ? (
            <ReportView 
              interviewReport={interviewReport} 
              handleDownloadReport={handleDownloadReport} 
              handleCloseReport={handleCloseReport} 
            />
          ) : null}

          <div className="absolute top-6 left-6 z-50 flex flex-col items-center gap-1 pointer-events-none select-none">
            {/* Logo Image */}
            {/* <img
              src={logo}
              alt="Intervue AI Logo"
              className="w-30 h-auto object-contain"
            /> */}

            {/* Brand Name Text (Positioned Below) */}
          </div>

          <div className="h-screen w-screen relative bg-[#09090b] overflow-hidden flex items-center justify-center">
            <InterviewBackground />
            <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none chat-content">
              <Card className="chat-card-container pointer-events-auto w-screen h-screen bg-[#09090b]/80 shadow-2xl rounded-none overflow-hidden backdrop-blur-sm flex flex-col transition-all duration-300">
                {/* ... Your Chat Content ... */}
                <div className="flex h-full flex-col z-10 relative w-full">
                  {codingSession.active && (
                    <div className="mx-4 mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-300 font-semibold">
                        Coding Prompt (Visible Until Round Ends)
                      </p>
                      <p className="text-sm text-emerald-100 mt-1">
                        {codeTask.prompt}
                      </p>
                      <p className="text-xs text-emerald-200/80 mt-2">
                        Attempts left:{" "}
                        {Math.max(
                          0,
                          codingSession.maxAttempts - codingSession.attemptsUsed
                        )}{" "}
                        / {codingSession.maxAttempts}
                      </p>
                    </div>
                  )}
                  <Conversation className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    <ConversationContent className="p-2 md:p-4 space-y-4">
                      {/* ... Copied exactly from your existing code ... */}
                      {callEnd ? (
                        <div ref={orbRef}>
                          <ConversationEmptyState
                            icon={
                              <Orb
                                className="size-25 orb-ref"
                                agentState="listening"
                              />
                            }
                            title="Are You Ready?"
                            description="Your interview session is ready. Click start to begin."
                            className="flex justify-center items-center"
                          />
                        </div>
                      ) : (
                        <>
                          {/* Video/Orb Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-10 w-full mx-auto">
                            <div className="border border-zinc-700 rounded-xl bg-zinc-900/50 flex justify-center items-center aspect-video overflow-hidden shadow-lg">
                              <Orb
                                className="w-full h-[85%] object-cover"
                                agentState={orbState}
                              />
                            </div>
                            <div className="border border-zinc-700 rounded-xl bg-zinc-900/50 flex justify-center items-center aspect-video overflow-hidden shadow-lg relative">
                              <video
                                ref={videoRef}
                                muted
                                className="w-full h-full object-cover transform -scale-x-100"
                                playsInline
                                autoPlay
                              />
                              {/* Live presence HUD */}
                              {!callEnd && liveMetrics && (
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full transition-opacity duration-500">
                                  <span className="text-[10px] text-zinc-400">👁</span>
                                  <span className={cn(
                                    "text-xs font-medium tabular-nums",
                                    liveMetrics.eyeContact >= 70 ? "text-emerald-400" :
                                    liveMetrics.eyeContact >= 40 ? "text-amber-400" : "text-rose-400"
                                  )}>
                                    {liveMetrics.eyeContact}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-center pt-6 px-8">
                            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
                              Live Subtitle
                            </p>
                            <p className="text-white min-h-[32px]">
                              {liveSubtitle || message[message.length - 1]?.text || "Listening..."}
                            </p>
                          </div>
                        </>
                      )}
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>

                  <CodeInterface
                    onSubmit={handleCodeSubmit}
                    isOpen={codingMode}
                    onClose={closeCodingMode}
                    task={codeTask}
                    codingSession={codingSession}
                  />

                  {/* CONTROLS FOOTER */}
                  <div className="w-full flex justify-center p-4 z-20">
                    <div className="flex items-center justify-center gap-3 px-3 py-2 bg-[#09090b]/80 border border-white/10 rounded-full shadow-2xl w-max">
                      {/* Status & Voice Picker (Your existing code) */}
                      <div className="flex items-center gap-2 px-2">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            connectionStatus === "active"
                              ? "bg-emerald-500"
                              : "bg-zinc-600"
                          )}
                        />
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                          {connectionStatus === "idle" ? "Idle" : "Active"}
                        </span>
                      </div>

                      <div className="w-[150px] border-l border-white/10 pl-3">
                        <VoicePicker
                          value={selectedVoice}
                          onValueChange={setSelectedVoice}
                          disabled={!callEnd}
                        />
                      </div>

                      <div className="w-[170px] border-l border-white/10 pl-3">
                        <PersonaPicker
                          value={selectedPersona}
                          onValueChange={setSelectedPersona}
                          disabled={!callEnd}
                        />
                      </div>

                      <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                        <button
                          onClick={handleMuteToggle}
                          disabled={callEnd}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-full text-zinc-300"
                        >
                          {isMuted ? (
                            <MicOff className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </button>
                        <div ref={callContainerRef} className="relative">
                          {!callEnd ? (
                            <button
                              onClick={endCall}
                              ref={buttonRef}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 transition-colors text-black text-xs font-semibold rounded-full"
                            >
                              End Call
                            </button>
                          ) : (
                            <button
                              onClick={startAgent}
                              ref={buttonRef}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 transition-colors text-black text-xs font-semibold rounded-full"
                            >
                              Start Call
                            </button>
                          )}
                        </div>
                        {!callEnd && !codingMode && (
                          <button
                            onClick={handleReset}
                            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white text-xs font-semibold tracking-wide"
                          >
                            RESET
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        // === HOME VIEW ===
        <WavyBackground className="p-4">
          <div className="font-bold text-4xl md:text-5xl lg:text-[68px] mb-6 text-center tracking-tight z-10">
            <h1 className="heroText">
              <span>Master Your</span>{" "}
              <span className="text-blue-400">Next Interview.</span>
            </h1>
          </div>

          <div className="text-sm md:text-lg text-center text-gray-200 leading-relaxed max-w-2xl mx-auto mb-8 px-4 z-10">
            <p className="subtitleText">
              An autonomous interview agent that listens, processes, and speaks.
            </p>
          </div>



          <div className="flex items-center justify-center">
            <Button
              onClick={() => setIsProcessing(true)} // This triggers SurveyModal from Home
              className="overflow-hidden"
              onMouseEnter={() => tlRef.current?.play()}
              onMouseLeave={() => tlRef.current?.reverse()}
              containerClassName="pop-btn"
            >
              <div
                ref={containerRef}
                className="relative h-5 overflow-hidden flex flex-col"
              >
                <span className="btn-text-1">Get started</span>
                <span className="absolute top-full left-0 right-0 btn-text-2">
                  Get started
                </span>
              </div>
            </Button>
          </div>

        </WavyBackground>
      )}
    </div>
  );
}

export default ChatConversation;
