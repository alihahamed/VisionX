import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ------------------------------------------------------------------
// MESSAGE WRAPPER
// ------------------------------------------------------------------
export const Message = ({ className, from, ...props }) => (
  <div
    data-role={from}
    className={cn(
      "group flex w-full items-start gap-3 ",
      // Align User to right, Assistant to left
      from === "user" ? "justify-end" : "justify-start",
      className
    )}
    {...props}
  />
)

// ------------------------------------------------------------------
// MESSAGE CONTENT (The Bubble)
// ------------------------------------------------------------------
const messageContentVariants = cva(
  // REDUCED PADDING AND GAP HERE
  "relative flex flex-col gap-1 rounded-2xl px-4 py-2.5 text-sm shadow-sm w-fit max-w-[70%] break-words whitespace-pre-wrap",
  {
    variants: {
      variant: {
        contained: [
          // USER STYLES (White bubble, Black text)
          "group-data-[role=user]:bg-white group-data-[role=user]:text-black group-data-[role=user]:rounded-br-none group-data-[role=user]:border-none",
          
          // ASSISTANT STYLES (Dark bubble, White text)
          "group-data-[role=assistant]:bg-[#27272a] group-data-[role=assistant]:text-white group-data-[role=assistant]:rounded-tl-none group-data-[role=assistant]:border-none",
        ],
        flat: [
          "bg-transparent px-0 py-0",
          "group-data-[role=user]:text-foreground",
          "group-data-[role=assistant]:text-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "contained",
    },
  }
)

export const MessageContent = ({
  children,
  className,
  variant,
  badge, // <--- 1. Accept a new 'badge' prop
  ...props
}) => (
  <div
    // 2. Add 'overflow-visible' to allow the badge to hang outside
    className={cn(messageContentVariants({ variant, className }), "overflow-visible")}
    {...props}
  >
    {/* 3. Position the badge absolutely in the top-right corner */}
    {badge && (
      <div className="absolute -top-3 -right-3 z-10 select-none">
        {badge}
      </div>
    )}
    {children}
  </div>
)

// ------------------------------------------------------------------
// MESSAGE AVATAR
// ------------------------------------------------------------------
export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}) => (
  <Avatar className={cn("size-8 ring-1 ring-border shrink-0", className)} {...props}>
    <AvatarImage alt="Avatar" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || "AI"}</AvatarFallback>
  </Avatar>
)