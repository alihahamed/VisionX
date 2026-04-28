"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "../createContext";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

function SurveyModal() {
  const [currentStep, setCurrentStep] = useState(1);
  const { survey, setSurvey, setIsProcessing, isProcessing, resettingMode } = useChat();

  const expRef = useRef(null);
  const stackRef = useRef(null);
  const targetRef = useRef(null);
  // 1. We attach this ref to the main wrapper to scope GSAP
  const containerRef = useRef(null); 

  useEffect(() => {
    if (currentStep === 2 && expRef.current) expRef.current.focus();
    if (currentStep === 3 && targetRef.current) targetRef.current.focus();
    if (currentStep === 4 && stackRef.current) stackRef.current.focus();
  }, [currentStep]);

  const handleKeyDown = (e, step) => {
    if (e.key === "Enter") {
      if (step === 1 && !survey.userName) return;
      if (step === 2 && !survey.experience) return;
      if (step === 3 && !survey.targetRole) return;
      if (step === 4 && !survey.techStack) return;

      if (step === 4) {
        handleExit();
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  console.log("resetting mode is:", resettingMode)
  console.log("current step:", currentStep)

  // 2. SCOPED GSAP ANIMATION
  useGSAP(() => {
    // Safety check: ensure the container actually exists before running
    // if (!containerRef.current) return;

    // Debugging: Check exactly what the component "sees" on mount
    console.log("GSAP Hook Running. Mode:", resettingMode ? "RESET" : "HOME");

    const tl = gsap.timeline();

    // 1. Force the content to be visible to the browser, but effectively hidden 
    //    so we can animate it IN. 'autoAlpha' handles opacity + visibility.
    gsap.set(".modal-content", { autoAlpha: 1 });
    console.log("resetting mode:", resettingMode)

    if (resettingMode) {
      // === RESET FLOW ===
      console.log("▶️ Executing Reset Animation");
      console.log("IsProcessing:", isProcessing)
      console.log("current step:", currentStep)
      
      
      // We use fromTo to FORCE the start and end states.
      // This prevents the "0 to 0" opacity bug.
      tl.fromTo(".modal-content", 
        { 
          y: 100, 
          autoAlpha: 0 // Start invisible
        },
        {
          y: 0,
          autoAlpha: 1, // End fully visible
          duration: 0.8,
          ease: "power3.out",
          delay: 0.2
        }
      );
    } else {
      // === HOME FLOW ===
      console.log("▶️ Executing Home Animation");

      // Verify banner cols exist before animating them to prevent warnings
      const banners = document.querySelectorAll(".banner-col");
      
      if (banners.length > 0) {
        tl.from(".banner-col", {
          yPercent: 100,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.inOut",
        });
      }

      tl.fromTo(".modal-content",
        { 
          autoAlpha: 0, 
          yPercent: 100 
        },
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.6,
          ease: "power3.out",
        },
        banners.length > 0 ? "-=0.4" : 0
      );
    }
  }, { 
    scope: containerRef, 
    // We add currentStep to dependencies only to prevent it re-running mid-survey
    dependencies: [isProcessing, resettingMode] 
  });

  const handleExit = () => {
    setSurvey({ ...survey, isCompleted: true });

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentStep(1);
        setIsProcessing(false)
      },
    });

    // Fade out content
    tl.to(".modal-content", {
      autoAlpha: 0, // handles opacity and sets visibility:hidden at end
      duration: 0.3,
      ease: "power3.in",
      yPercent: -10,
    });

    if (resettingMode) {
        console.log("👋 Reset Exit");
        // Animate the static white background shutters out
        tl.to(".shutter-top-exit", {
        yPercent: -100,
        duration: 0.8,
        ease: "power3.inOut"
      }, "<+=0.1"); // Start slightly after content begins fading

      // Bottom goes Down (100%)
      tl.to(".shutter-bottom-exit", {
        yPercent: 100,
        duration: 0.8,
        ease: "power3.inOut"
      }, "<"); // Run at the same time as top shutter
    } else {
        console.log("👋 Home Exit");
        tl.to(".banner-col", {
            yPercent: 100,
            duration: 0.7,
            stagger: {
              each: 0.2,
              from: "end",
            },
            ease: "power3.inOut",
          }, "-=0.1");
    }
  };

  const inputStyles =
    "w-full bg-transparent border-0 border-b-2 border-zinc-700 rounded-none text-black text-lg md:text-xl py-2 px-0 h-auto focus:border-black focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors placeholder:text-zinc-700";

  const ROLE_OPTIONS = {
    "Frontend Developer": ["React", "Vue", "Next.js"],
    "Backend Developer": ["Node.js", "Django"],
    "Devops Engineer": ["AWS", "Docker"],
    "Fullstack Developer": ["MERN"],
    "UI/UX Designer": ["Figma"],
  };

  return (
    <>
      {isProcessing && (
        <div
          ref={containerRef} // KEY: Scope matches useGSAP
          className="fixed inset-0 z-100 flex w-screen h-screen overflow-hidden"
        >
          {resettingMode ? (
            // === RESET BACKGROUND (Static White) ===
            <div className="absolute inset-0 flex flex-col w-full h-full z-0 pointer-events-none zz">
              <div className="static-shutter shutter-top-exit w-full h-1/2 bg-white" />
              <div className="static-shutter shutter-bottom-exit w-full h-1/2 bg-white" />
            </div>
          ) : (
            // === HOME BACKGROUND (Dynamic Banners) ===
            <div className="absolute inset-0 flex w-full h-full z-0 pointer-events-none">
              <div className="banner-col w-1/4 h-full bg-white" />
              <div className="banner-col w-1/4 h-full bg-white" />
              <div className="banner-col w-1/4 h-full bg-white" />
              <div className="banner-col w-1/4 h-full bg-white" />
            </div>
          )}

          {/* === CONTENT === */}
          {/* Added opacity-0 default so it doesn't flash before GSAP catches it */}
          <div className="modal-content relative z-[200]  flex w-full h-full opacity-0">
            {/* LEFT COLUMN: Form */}
            <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-8 sm:p-16 relative">
              <div className="w-full max-w-lg flex flex-col gap-6 mt-auto">
                <div className="mb-4">
                  <h2 className="text-5xl md:text-[65px] vintage tracking-wide text-black">
                    Let's tailor your <br />
                    <span className="text-blue-600">experience.</span>
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Q1 Name */}
                  <div className={`transition-all duration-500 ${currentStep > 1 ? "opacity-50" : "opacity-100"}`}>
                    <label className="text-sm text-indigo-700 uppercase tracking-wider ml-1">What's Your Name?</label>
                    <Input
                      type="text"
                      value={survey.userName}
                      onChange={(e) => setSurvey({ ...survey, userName: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, 1)}
                      readOnly={currentStep > 1}
                      placeholder="Enter your name..."
                      autoFocus
                      className={inputStyles}
                    />
                  </div>

                  {/* Q2 Experience */}
                  {currentStep >= 2 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <label className="text-sm font-mono text-purple-700 uppercase tracking-wider ml-1">Years of Experience</label>
                      <Select value={survey.experience} onValueChange={(value) => setSurvey({ ...survey, experience: value })} disabled={currentStep > 2}>
                        <SelectTrigger ref={expRef} onKeyDown={(e) => handleKeyDown(e, 2)} className="w-full bg-transparent border-0 border-b-2 border-zinc-700 rounded-none text-black text-2xl py-2 px-0 h-auto focus:border-black focus:ring-0">
                          <SelectValue placeholder="Select Level..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          <SelectItem value="No experience" className="text-white focus:bg-zinc-800">No experience</SelectItem>
                          <SelectItem value="Junior" className="text-white focus:bg-zinc-800">Junior (0-2 Years)</SelectItem>
                          <SelectItem value="Mid" className="text-white focus:bg-zinc-800">Mid-Level (2-5 Years)</SelectItem>
                          <SelectItem value="Senior" className="text-white focus:bg-zinc-800">Senior (5+ Years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Q3 Target Role */}
                  {currentStep >= 3 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <label className="text-xs text-cyan-600 uppercase tracking-wider ml-1">Target Role?</label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.keys(ROLE_OPTIONS).map((role) => (
                          <button
                            key={role}
                            ref={targetRef}
                            className={`p-3 text-sm font-medium border rounded-md transition-all duration-200 text-left ${survey.targetRole === role ? "bg-red-600 border-red-600 text-white" : "bg-transparent border-zinc-700 text-zinc-500 hover:border-red-500 hover:text-red-400"}`}
                            onKeyDown={(e) => handleKeyDown(e, 3)}
                            onClick={() => setSurvey({ ...survey, targetRole: role, techStack: "" })}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Q4 Tech Stack */}
                  {currentStep >= 4 && survey.targetRole && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <label className="text-xs text-red-600 uppercase tracking-wider ml-1">Tech Stack?</label>
                      <div className="flex flex-wrap gap-2">
                        {(ROLE_OPTIONS[survey.targetRole] || []).map((stack) => (
                          <button
                            key={stack}
                            ref={stackRef}
                            onKeyDown={(e) => handleKeyDown(e, 4)}
                            onClick={() => setSurvey({ ...survey, techStack: stack })}
                            className={`px-4 py-2 text-sm rounded-full border transition-all ${survey.techStack === stack ? "bg-cyan-600 border-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]" : "bg-zinc-100 border-zinc-300 text-zinc-600 hover:border-cyan-500"}`}
                          >
                            {stack}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-zinc-800 text-sm animate-pulse">
                    Press Enter ↵ to {currentStep === 4 ? "start interview" : "continue"}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Placeholder for 3D/Design */}
            <div className="hidden lg:flex w-1/2 h-full bg-transparent relative"></div>
          </div>
        </div>
      )}
    </>
  );
}

export default SurveyModal;