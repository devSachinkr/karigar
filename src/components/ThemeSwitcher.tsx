"use client";

import { useState } from "react";
import { Check, ChevronDown, Moon, Palette, Sun } from "lucide-react";
import { ThemeName, useKarigarTheme } from "@/components/ThemeProvider";

const palettes: { id: ThemeName; label: string; color: string }[] = [
  { id: "verdant", label: "Verdant", color: "#28735b" },
  { id: "indigo", label: "Indigo", color: "#5b5bc7" },
  { id: "sunset", label: "Saffron", color: "#c75c36" },
  { id: "rose", label: "Rose", color: "#b14871" },
  { id: "ocean", label: "Ocean", color: "#287f91" },
  { id: "marigold", label: "Marigold", color: "#aa761b" },
  { id: "terracotta", label: "Terracotta", color: "#a84f3b" },
];

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme, mode, toggleMode } = useKarigarTheme();
  return (
    <div className="theme-picker-wrap">
      <button className="theme-trigger mode-trigger" aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`} title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`} onClick={toggleMode}>
        {mode === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
      </button>
      <button className="theme-trigger palette-trigger" aria-expanded={open} aria-label="Choose a color palette" onClick={() => setOpen(!open)}>
        <Palette size={16}/><span className="theme-current-dot" style={{ background: palettes.find(p => p.id === theme)?.color }}/><ChevronDown size={14}/>
      </button>
      {open && <div className="theme-menu">{palettes.map(palette => <button key={palette.id} onClick={() => {setTheme(palette.id);setOpen(false)}}><span className="palette-dot" style={{background:palette.color}}/>{palette.label}{theme===palette.id&&<Check size={14}/>}</button>)}</div>}
    </div>
  );
}
