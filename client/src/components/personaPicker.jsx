"use client";

import * as React from "react";
import { Check, ChevronDown, User, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const personas = [
  {
    id: "balanced",
    name: "Balanced",
    style: "Fair & Thorough",
    description: "Structured, balanced evaluation. Covers breadth and depth equally.",
    previewColor: "bg-blue-500",
  },
  {
    id: "strict_architect",
    name: "Strict Architect",
    style: "System Design Focus",
    description: "Pushes hard on scalability, tradeoffs, and production thinking.",
    previewColor: "bg-rose-500",
  },
  {
    id: "friendly_mentor",
    name: "Friendly Mentor",
    style: "Encouraging & Guided",
    description: "Supportive tone with hints. Great for practice and confidence building.",
    previewColor: "bg-emerald-500",
  },
  {
    id: "devil_advocate",
    name: "Devil's Advocate",
    style: "Challenges Everything",
    description: "Questions every answer. Tests conviction, edge cases, and reasoning depth.",
    previewColor: "bg-amber-500",
  },
];

export { personas };

export function PersonaPicker({ value, onValueChange, disabled }) {
  const [open, setOpen] = React.useState(false);
  const selectedPersona = personas.find((p) => p.id === value) || personas[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full h-11 px-4 overflow-hidden",
            disabled && "opacity-50 cursor-not-allowed grayscale-[0.5]"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <div
                className={cn(
                  "w-3 h-3 rounded-full blur-[2px] animate-pulse",
                  selectedPersona.previewColor
                )}
              />
              <div
                className={cn(
                  "absolute inset-0 w-3 h-3 rounded-full opacity-50 animate-ping",
                  selectedPersona.previewColor
                )}
              />
            </div>
            <div className="flex flex-col items-start text-left leading-none min-w-0">
              <span className="text-sm font-medium truncate w-full">{selectedPersona.name}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5 truncate w-full">
                {selectedPersona.style}
              </span>
            </div>
          </div>
          <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-zinc-950 border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50" side="top" align="center">
        <Command className="bg-transparent">
          <CommandList className="max-h-[420px] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <CommandEmpty>No persona found.</CommandEmpty>
            <CommandGroup
              heading="Interviewer Persona"
              className="text-zinc-500 px-2"
            >
              {personas.map((persona) => (
                <CommandItem
                  key={persona.id}
                  value={persona.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between py-3 px-3 rounded-xl cursor-pointer aria-selected:bg-zinc-900 data-[selected=true]:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                        persona.previewColor
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200">
                        {persona.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Brain className="w-3 h-3" />
                          {persona.style}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-1 leading-snug max-w-[240px]">
                        {persona.description}
                      </span>
                    </div>
                  </div>
                  {value === persona.id && (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
