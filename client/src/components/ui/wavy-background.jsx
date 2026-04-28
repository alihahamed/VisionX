"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}) => {
  const noise = createNoise3D();
  let w, h, nt, i, x, ctx, canvas;
  const canvasRef = useRef(null);

  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  };

  const init = () => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");
    
    // Initial size setup
    w = ctx.canvas.width = window.innerWidth;
    h = ctx.canvas.height = window.innerHeight;
    ctx.filter = `blur(${blur}px)`;
    nt = 0;
    
    render();
  };

  const waveColors = colors ?? [
    "#3b82f6", // Blue 500 (Bright primary blue)
    "#0ea5e9", // Sky 500 (Vibrant light blue)
    "#60a5fa", // Blue 400 (Softer blue)
    "#2563eb", // Blue 600 (Deeper blue for contrast)
    "#06b6d4", // Cyan 500 (Adds a techy teal accent)
];

  const drawWave = (n) => {
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.lineWidth = waveWidth || 50;
      ctx.strokeStyle = waveColors[i % waveColors.length];
      for (x = 0; x < w; x += 5) {
        var y = noise(x / 800, 0.3 * i, nt) * 100;
        ctx.lineTo(x, y + h * 0.5);
      }
      ctx.stroke();
      ctx.closePath();
    }
  };

  let animationId;
  const render = () => {
    // Safety check if canvas still exists
    if (!ctx) return;
    
    ctx.fillStyle = backgroundFill || "black";
    ctx.globalAlpha = waveOpacity || 0.5;
    ctx.fillRect(0, 0, w, h);
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    init();
    
    // FIX: Use proper event listener instead of window.onresize
    const handleResize = () => {
      if (canvasRef.current && ctx) {
        w = ctx.canvas.width = window.innerWidth;
        h = ctx.canvas.height = window.innerHeight;
        ctx.filter = `blur(${blur}px)`;
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center min-h-[100dvh] w-full overflow-hidden",
        containerClassName
      )}
    >
      <canvas
        // FIX: Changed absolute to FIXED. This stops the height explosion.
        className="fixed inset-0 z-0 pointer-events-none"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      ></canvas>
      
      {/* Content Wrapper */}
      <div className={cn("relative z-10 w-full flex flex-col items-center justify-center", className)} {...props}>
        {children}
      </div>
    </div>
  );
};