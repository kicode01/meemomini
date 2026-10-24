
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Contrast, Sun, SunMedium } from "lucide-react";
import React from "react";

type SettingProps = {
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
};

function SettingSlider({ label, icon, min, max, step, value, onChange, className }: SettingProps) {
  return (
    <div className={`flex flex-col gap-2.5 mb-5 last:mb-1 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-700">
          {icon}
          <span className="text-[13px] font-bold tracking-tight">{label}</span>
        </div>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full min-w-[36px] text-center">
          {value}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={vals => onChange(vals[0])}
        className="w-full"
      />
    </div>
  );
}

type AdvancedSettingsPanelProps = {
  contrast: number;
  setContrast: (v: number) => void;
  brightness: number;
  setBrightness: (v: number) => void;
  saturation: number;
  setSaturation: (v: number) => void;
  reset: () => void;
};

export default function AdvancedSettingsPanel(props: AdvancedSettingsPanelProps) {
  const { contrast, setContrast, brightness, setBrightness, saturation, setSaturation, reset } = props;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm transition-all"
        >
          <SunMedium className="h-4 w-4" />
          <span className="text-[11px] font-black uppercase tracking-widest mt-[1px]">Advanced</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 w-[280px] z-50">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Adjustments</h3>
          <button 
            onClick={reset} 
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md"
          >
            Reset
          </button>
        </div>
        <div>
          <SettingSlider
            label="Contrast"
            icon={<Contrast className="h-4 w-4 text-indigo-500" />}
            min={50}
            max={200}
            step={1}
            value={contrast}
            onChange={setContrast}
          />
          <SettingSlider
            label="Brightness"
            icon={<Sun className="h-4 w-4 text-amber-500" />}
            min={50}
            max={200}
            step={1}
            value={brightness}
            onChange={setBrightness}
          />
          <SettingSlider
            label="Saturation"
            icon={<SunMedium className="h-4 w-4 text-rose-500" />}
            min={50}
            max={200}
            step={1}
            value={saturation}
            onChange={setSaturation}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
