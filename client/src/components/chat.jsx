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
import CodeInterface from "./codeInterface";
import logo from "../assets/intervue-logo.png";

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
        linesGradient={["#0f172a", "#1e293b", "#334155", "#0f172a"]}
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

const HomeNav = React.memo(() => {
  return (
    <PillNav
      logo={ghost}
      items={[{ label: "How It Works", href: "/" }]}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 home-nav"
      ease="power2.easeOut"
      baseColor="white"
      pillColor="black"
      hoveredPillTextColor="black"
      pillTextColor="white"
      animationDelay={6.1}
    />
  );
});

// Give it a display name for debugging
InterviewBackground.displayName = "InterviewBackground";
CallNav.displayName = "CallNav";
HomeNav.displayName = "HomeNav";

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

  // FIX: Track messages in a Ref so we can read them without re-triggering effects
  const messagesRef = useRef(message);
  useEffect(() => {
    messagesRef.current = message;
  }, [message]);

  useEffect(() => {
    outboundAudioMutedRef.current = isMuted;
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
      await fetch("http://localhost:3021/api/voice-telemetry", {
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

  let isMounted = true;

  const startAgent = async () => {
    try {
      setConnectionStatus("connecting");
      setCallEnd(false);
      setIsMuted(false);
      console.log(" Starting Agent Connection...");
      console.log(callEnd);

       // fetch instructions (RAG questions/answer data) and token response for verification for deepgram
      const [instructionsResponse, tokenResponse] = await Promise.all([
        fetch("http://localhost:3021/api/get-voice-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyData: survey,
            sessionId: voiceSessionIdRef.current,
          }),
        }),
        fetch("http://localhost:3021/api/get-agent-token"),
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
                    "Call this Function when you ask a coding question that requires the user to write code.",
                  parameters: {
                    type: "object",
                    properties: {},
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
            // function request
            const call = event.functions[0];
            // console.log("name", call.name)
            // console.log("id", call.id)

            if (call.name === "enable_coding_mode") {
              setCodingMode(true);
              const response = {
                type: "FunctionCallResponse",
                id: call.id,
                name: call.name,
                content:
                  "Coding mode enabled. The user is now seeing the code box.",
              };
              // console.log("function response", JSON.stringify(response));
              // console.log(
              //   "succesfully recieved the function call, coding mode enabled"
              // );
              socketRef.current.send(JSON.stringify(response));
            }
          }

          if (event.type === "Error") console.error("DEEPGRAM ERROR:", event);
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
            addMessage(
              event.role === "user" ? "user" : "assistant",
              event.content
            );
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
          }
        }
      };
    } catch (error) {
      console.error("❌ Setup Error:", error);
      if (isMounted) setConnectionStatus("error");
    }
  };

  const handleCodeSubmit = (codeSnippet) => {
    if (connectionStatus === "active") {
      const response = {
        type: "InjectUserMessage",
        content: `Here is the code i wrote:\n ${codeSnippet}`,
      };

      console.log("code submit response", JSON.stringify(response));
      socketRef.current.send(JSON.stringify(response));
    }
  };

  const handleCodeExit = () => {
    setCodingMode(false);
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
          <div className="absolute top-6 left-6 z-50 flex flex-col items-center gap-1 pointer-events-none select-none">
            {/* Logo Image */}
            {/* <img
              src={logo}
              alt="Intervue AI Logo"
              className="w-30 h-auto object-contain"
            /> */}

            {/* Brand Name Text (Positioned Below) */}
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/70">
              Intervue AI
            </span>
          </div>

          <div className="h-screen w-screen relative bg-[#09090b] overflow-hidden flex items-center justify-center pb-20">
            <InterviewBackground />
            <div className="relative z-10 w-full flex items-center justify-center px-4 pointer-events-none chat-content">
              <Card className="chat-card-container pointer-events-auto w-full max-w-5xl h-[75vh] min-h-[550px] max-h-[850px] bg-[#09090b]/80 shadow-2xl rounded-xl overflow-hidden backdrop-blur-sm flex flex-col transition-all duration-300">
                {/* ... Your Chat Content ... */}
                <div className="flex h-full flex-col z-10 relative w-full">
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-10 w-full max-w-5xl mx-auto">
                            <div className="border border-zinc-700 rounded-xl bg-zinc-900/50 flex justify-center items-center aspect-video overflow-hidden shadow-lg">
                              <Orb
                                className="w-full h-[85%] object-cover"
                                agentState={orbState}
                              />
                            </div>
                            <div className="border border-zinc-700 rounded-xl bg-zinc-900/50 flex justify-center items-center aspect-video overflow-hidden shadow-lg">
                              <video
                                ref={videoRef}
                                muted
                                className="w-full h-full object-cover transform -scale-x-100"
                                playsInline
                                autoPlay
                              />
                            </div>
                          </div>
                          {message.length > 0 && (
                            <div className="text-center pt-12">
                              <p className="text-white">
                                {message[message.length - 1].text}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>

                  <CodeInterface
                    onSubmit={handleCodeSubmit}
                    isOpen={codingMode}
                    onClose={() => setCodingMode(false)}
                  />

                  {/* CONTROLS FOOTER */}
                  <div className="w-full flex justify-center p-4 z-20">
                    <div className="flex items-center justify-between gap-4 px-5 py-3 bg-[#09090b]/60 border border-white/10 rounded-full shadow-2xl w-full max-w-md">
                      {/* Status & Voice Picker (Your existing code) */}
                      <div className="flex items-center gap-3">
                        {/* ... status indicator ... */}
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            connectionStatus === "active"
                              ? "bg-emerald-500"
                              : "bg-zinc-600"
                          )}
                        />
                        <span className="text-zinc-500 text-sm font-semibold">
                          {connectionStatus === "idle" ? "Idle" : "Active"}
                        </span>
                      </div>

                      <div className="flex-1 max-w-[200px]">
                        <VoicePicker
                          value={selectedVoice}
                          onValueChange={setSelectedVoice}
                          disabled={!callEnd}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          disabled={callEnd}
                          className="p-2.5 bg-zinc-800 rounded-full text-zinc-300"
                        >
                          {isMuted ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </button>
                        <div ref={callContainerRef} className="relative">
                          {!callEnd ? (
                            <button
                              onClick={endCall}
                              ref={buttonRef}
                              className="px-5 py-2.5 bg-red-500 text-black text-sm font-medium rounded-full"
                            >
                              End Call
                            </button>
                          ) : (
                            <button
                              onClick={startAgent}
                              ref={buttonRef}
                              className="px-5 py-2.5 bg-emerald-500 text-black text-sm font-medium rounded-full"
                            >
                              Start Call
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            {/* Use handleReset here */}
            {!callEnd && <CallNav onReset={handleReset} />}
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

          <div className="gap-3 flex justify-center items-center mb-5 z-10 techPills">
            <HoverBorderGradient
              containerClassName="rounded-full"
              className="bg-white/10 text-white text-xs px-4 py-1.5"
            >
              React
            </HoverBorderGradient>
            <HoverBorderGradient
              containerClassName="rounded-full"
              className="bg-white/10 text-white text-xs px-4 py-1.5"
            >
              NodeJs
            </HoverBorderGradient>
            <HoverBorderGradient
              containerClassName="rounded-full"
              className="bg-white/10 text-white text-xs px-4 py-1.5"
            >
              SLM's
            </HoverBorderGradient>
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
          <HomeNav />
        </WavyBackground>
      )}
    </div>
  );
}

export default ChatConversation;
