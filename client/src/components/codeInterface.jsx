import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "../createContext";
import { Code2, Terminal, Send, ChevronLeft, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

function CodeInterface({ onSubmit, onClose, isOpen, task, codingSession }) {
  const { message, codingMode } = useChat();
  const [code, setCode] = useState("");
  const [submitState, setSubmitState] = useState("idle"); // idle | submitting | success | error
  const [submitMessage, setSubmitMessage] = useState("");
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const tlRef = useRef(null) // creating a ref to store the timeline

  //   useEffect(() =>{
  //     if(codingMode) setCode("Write your code here")
  //   }, [codingMode])

  const instruction = useMemo(() => {
    if (task?.prompt) return task.prompt;
    const aiMessage = message.filter((m) => m.sender === "assistant");
    const recentMessages = aiMessage.slice(-3).reverse(); 
    const longMessage = recentMessages.find((m) => m.text.length > 50);
    return longMessage
      ? longMessage.text
      : recentMessages[0]?.text || "Ready to code.";
  }, [message, task?.prompt]);

  const subtitleText = useMemo(() => {
    const lastMsg = message[message.length - 1];
    return lastMsg?.text || "Listening...";
  }, [message]);

  useEffect(() => {
    if (!isOpen) return;
    setCode(task?.starterCode || "");
    setSubmitState("idle");
    setSubmitMessage("");
  }, [isOpen, task?.starterCode, task?.prompt]);

  useGSAP(() => {
    const tl = gsap.timeline({
      onReverseComplete: () => { // when the animation is reversed the onclose function is called
        onClose()
      }
    });

    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 }
    ).fromTo(
      contentRef.current,
      { y: 40, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.2)" },
      "-=0.2"
    );

    tlRef.current = tl
  }, [isOpen]);

  const handleExit = () => {
    setSubmitState("idle");
    setSubmitMessage("");
    if(tlRef.current){ // if the time line exists then
      tlRef.current.reverse() // reverse the timeline animation on handleExit
    } else {
      onClose() // cleanup function just in case so that the interface closes regardless.
    }
  }

  const handleSubmit = async () => {
    if (submitState === "submitting") return;
    const trimmed = (code || "").trim();
    if (!trimmed) {
      setSubmitState("error");
      setSubmitMessage("Write code before submit.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage("Submitting...");
    const result = await Promise.resolve(onSubmit(trimmed));
    if (result?.ok) {
      setSubmitState("success");
      setSubmitMessage("Submitted. Interviewer reviewing now.");
      return;
    }
    setSubmitState("error");
    setSubmitMessage(result?.error || "Submit failed.");
  };

  if (isOpen) {
    console.log("isOpen state", isOpen)
    console.log("coding state", codingMode)
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-[70] flex items-center justify-center p-0 bg-black/65 backdrop-blur-sm"
      >
        <div
          ref={contentRef}
          className="relative w-screen h-screen flex flex-col md:flex-row bg-[#0c0c0e] border-0 rounded-none shadow-none overflow-hidden"
        >
          {/* --- LEFT SIDEBAR: PROBLEM CONTEXT (Desktop Only) --- */}
          <div className="hidden md:flex flex-col w-[360px] bg-zinc-900/30 border-r border-white/5 p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
                Challenge
              </span>
            </div>

            <h3 className="text-zinc-100 font-semibold mb-3">
              {task?.title || "Instructions"}
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-zinc-400 text-sm leading-relaxed font-light italic">
                "{instruction}"
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-zinc-500">
                  Attempts left:{" "}
                  {Math.max(
                    0,
                    (codingSession?.maxAttempts || 3) -
                      (codingSession?.attemptsUsed || 0)
                  )}{" "}
                  / {codingSession?.maxAttempts || 3}
                </p>
                {codingSession?.lastHint && (
                  <p className="text-xs text-amber-300/90">
                    Hint: {codingSession.lastHint}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* --- MAIN EDITOR AREA --- */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* HEADER (Mobile Responsive) */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/20">
              <div className="flex flex-col md:hidden">
                {" "}
                {/* Mobile Instruction Label */}
                <span className="text-[9px] font-bold text-emerald-500 uppercase mb-1">
                  Current Task
                </span>
                <p className="text-zinc-400 text-[11px] line-clamp-1 italic">
                  "{instruction}"
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Code2 className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-mono text-zinc-500">main.js</span>
              </div>

              <button
                onClick={handleExit}
                className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
              >
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Exit
                </span>
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-white/5 bg-zinc-950/70">
              <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">
                Subtitle
              </p>
              <p className="text-sm text-zinc-200 break-words">
                {subtitleText}
              </p>
            </div>

            {/* CODE TEXTAREA */}
            <div className="flex-1 relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent text-zinc-300 font-mono text-sm p-6 md:p-8 resize-none focus:outline-none leading-7 selection:bg-emerald-500/30"
                spellCheck="false"
                autoFocus
              />
              {/* Syntax Line Numbers Decorator */}
              <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 border-r border-white/[0.02] flex flex-col items-center pt-8 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-zinc-800 font-mono mb-4"
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-4 md:p-6 bg-zinc-900/40 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/20" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                </div>
                <span className="hidden sm:inline text-[10px] text-zinc-600 font-mono">
                  UTF-8 // JavaScript
                </span>
              </div>

              <div className="flex flex-col items-end gap-2">
                {submitState !== "idle" && (
                  <span
                    className={`text-xs ${
                      submitState === "error"
                        ? "text-red-400"
                        : submitState === "success"
                        ? "text-emerald-400"
                        : "text-zinc-400"
                    }`}
                  >
                    {submitMessage}
                  </span>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitState === "submitting"}
                  className="flex items-center gap-3 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-black rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 group"
                >
                <span className="text-xs font-bold uppercase tracking-tighter">
                  {submitState === "submitting"
                    ? "Submitting..."
                    : "Execute Solution"}
                </span>
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return null;
  }
}

export default CodeInterface;
