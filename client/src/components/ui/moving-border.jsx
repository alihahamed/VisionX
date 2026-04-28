"use client";
import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

export function Button({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  className,
  ...otherProps
}) {
  return (
    <Component
      className={cn(
        "relative h-12 w-48 overflow-hidden bg-transparent p-[1px] text-lg font-semibold mt-12 bottom-10",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: "inherit" }}
      >
        {/* We hardcode rx/ry to {24} (Numbers). 
            This is exactly half of h-12 (48px). 
            It CANNOT fail to be round. */}
        <MovingBorder duration={duration} rx={24} ry={24}>
          <div
            className={cn(
              "h-20 w-20 bg-[radial-gradient(#38bdf8_40%,transparent_60%)] opacity-[1.2]",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center border border-slate-800 bg-slate-950 text-sm text-white antialiased backdrop-blur-xl cursor-pointer",
          className
        )}
        style={{
          borderRadius: "inherit",
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 3000,
  rx,
  ry,
  ...otherProps
}) => {
  const pathRef = useRef();
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(progress, (val) => {
    // 1. Check if the element exists
    if (!pathRef.current) return 0;
    
    // 2. Check if the element has calculated dimensions (length)
    // This prevents the "InvalidStateError"
    const length = pathRef.current.getTotalLength();
    if (!length) return 0;

    return pathRef.current.getPointAtLength(val).x;
  });

  const y = useTransform(progress, (val) => {
    if (!pathRef.current) return 0;
    
    const length = pathRef.current.getTotalLength();
    if (!length) return 0;

    return pathRef.current.getPointAtLength(val).y;
  });

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};