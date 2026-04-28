import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "../createContext";
import { Code2, Terminal, Send, ChevronLeft, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

function CodeInterface({ onSubmit, onClose, isOpen }) {
  const { setCodingMode, message, codingMode } = useChat();
  const [code, setCode] = useState("");
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const tlRef = useRef(null) // creating a ref to store the timeline

  //   useEffect(() =>{
  //     if(codingMode) setCode("Write your code here")
  //   }, [codingMode])

  const instruction = useMemo(() => {
    const aiMessage = message.filter((m) => m.sender === "assistant");
    const recentMessages = aiMessage.slice(-3).reverse(); 
    const longMessage = recentMessages.find((m) => m.text.length > 50);
    return longMessage
      ? longMessage.text
      : recentMessages[0]?.text || "Ready to code.";
  }, [message]);

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
    if(tlRef.current){ // if the time line exists then
      tlRef.current.reverse() // reverse the timeline animation on handleExit
    } else {
      onClose() // cleanup function just in case so that the interface closes regardless.
    }
  }

  if (isOpen) {
    console.log("isOpen state", isOpen)
    console.log("coding state", codingMode)
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 z-[60] flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-sm"
      >
        <div
          ref={contentRef}
          className="relative w-full h-full max-w-5xl flex flex-col md:flex-row bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* --- LEFT SIDEBAR: PROBLEM CONTEXT (Desktop Only) --- */}
          <div className="hidden md:flex flex-col w-72 bg-zinc-900/30 border-r border-white/5 p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">
                Challenge
              </span>
            </div>

            <h3 className="text-zinc-100 font-semibold mb-3">Instructions</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-zinc-400 text-sm leading-relaxed font-light italic">
                "{instruction}"
              </p>
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

              <button
                onClick={() => onSubmit(code)}
                className="flex items-center gap-3 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 group"
              >
                <span className="text-xs font-bold uppercase tracking-tighter">
                  Execute Solution
                </span>
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
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
