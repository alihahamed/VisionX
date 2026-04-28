"use client";

import * as React from "react";
import { Check, ChevronDown, Languages, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChat } from "../createContext";
const voices = [
  {
    id: "aura-2-thalia-en",
    name: "Thalia",
    language: "English (US)",
    type: "Feminine",
    previewColor: "bg-blue-500",
  },
  {
    id: "aura-2-theia-en",
    name: "Theia",
    language: "English (AUS)",
    type: "Feminine",
    previewColor: "bg-purple-500",
  },
  {
    id: "aura-2-zeus-en",
    name: "Zeus",
    language: "English (US)",
    type: "Masculine",
    previewColor: "bg-emerald-500",
  },
];

export function VoicePicker({ value, onValueChange, disabled }) {
  const [open, setOpen] = React.useState(false);
  const selectedVoice = voices.find((v) => v.id === value) || voices[0];
  const { setSurvey, survey } = useChat();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full h-11 px-4",
            disabled && "opacity-50 cursor-not-allowed grayscale-[0.5]"
          )}
        >
          <div className="flex items-center gap-3">
            {/* The Orb Placeholder */}
            <div className="relative flex items-center justify-center">
              <div
                className={cn(
                  "w-3 h-3 rounded-full blur-[2px] animate-pulse",
                  selectedVoice.previewColor
                )}
              />
              <div
                className={cn(
                  "absolute inset-0 w-3 h-3 rounded-full opacity-50 animate-ping",
                  selectedVoice.previewColor
                )}
              />
            </div>
            <div className="flex flex-col items-start text-left leading-none">
              <span className="text-sm font-medium">{selectedVoice.name}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                {selectedVoice.type}
              </span>
            </div>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-zinc-950 border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search voices..."
            className="border-none focus:ring-0 text-zinc-300 h-12"
          />
          <CommandList className="max-h-[300px] scrollbar-thin scrollbar-thumb-zinc-800">
            <CommandEmpty>No voice found.</CommandEmpty>
            <CommandGroup
              heading="Available Voices"
              className="text-zinc-500 px-2"
            >
              {voices.map((voice) => (
                <CommandItem
                  key={voice.id}
                  value={voice.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue);
                    setOpen(false);
                    setSurvey({...survey, agentName:voice.name})
                  }}
                  className="flex items-center justify-between py-3 px-3 rounded-xl cursor-pointer aria-selected:bg-zinc-900 data-[selected=true]:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    {/* Orb for list item */}
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                        voice.previewColor
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-200">
                        {voice.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Languages className="w-3 h-3" />
                          {voice.language}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Sparkles className="w-3 h-3" />
                          {voice.type}
                        </div>
                      </div>
                    </div>
                  </div>
                  {value === voice.id && (
                    <Check className="h-4 w-4 text-emerald-500" />
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
