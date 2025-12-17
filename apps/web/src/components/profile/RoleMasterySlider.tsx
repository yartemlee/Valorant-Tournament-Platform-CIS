import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { roleProficiencyLevels } from "@/constants/proficiency";

interface RoleMasterySliderProps {
    value: number;
    onValueChange: (value: number) => void;
    onValueCommit?: (value: number) => void;
    disabled?: boolean;
    className?: string;
}

export function RoleMasterySlider({
    value,
    onValueChange,
    onValueCommit,
    disabled,
    className,
}: RoleMasterySliderProps) {
    const max = roleProficiencyLevels.length - 1;
    const currentLevel = roleProficiencyLevels[Math.round(value)] || roleProficiencyLevels[0];
    const [isDragging, setIsDragging] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const prevValueRef = React.useRef(value);

    // Detect track click (value changed but not dragging)
    React.useEffect(() => {
        if (value !== prevValueRef.current && !isDragging) {
            // This is a track click, enable animation
            setIsAnimating(true);
            // Disable animation after it completes
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
        prevValueRef.current = value;
    }, [value, isDragging]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Label Above */}
            <div className="flex justify-center">
                <span
                    className={cn(
                        "text-lg font-bold transition-colors duration-300",
                        currentLevel.color
                    )}
                >
                    {currentLevel.label}
                </span>
            </div>

            <SliderPrimitive.Root
                min={0}
                max={max}
                step={0.01}
                value={[value]}
                onValueChange={(vals) => onValueChange(vals[0])}
                onValueCommit={(vals) => {
                    const snapped = Math.round(vals[0]);
                    onValueChange(snapped);
                    onValueCommit?.(snapped);
                    setIsDragging(false);
                }}
                disabled={disabled}
                className="relative flex w-full touch-none select-none items-center py-4 group"
            >
                {/* Track */}
                <SliderPrimitive.Track className="relative h-4 w-full grow rounded-full bg-neutral-900/50 shadow-inner ring-1 ring-white/5">
                    {/* Notches */}
                    <div className="absolute inset-0 flex justify-between items-center px-[5px]">
                        {roleProficiencyLevels.map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "h-2 w-2 rounded-full transition-all duration-300",
                                    "bg-neutral-950 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)]",
                                    index <= value ? "bg-opacity-0" : "bg-opacity-100"
                                )}
                            />
                        ))}
                    </div>

                    {/* Fill Range */}
                    <SliderPrimitive.Range
                        className={cn(
                            "absolute h-full rounded-full bg-gradient-to-r from-purple-500/50 to-purple-500 opacity-80",
                            isAnimating && !isDragging && "transition-all duration-300 ease-out"
                        )}
                    />
                </SliderPrimitive.Track>

                {/* Thumb */}
                <SliderPrimitive.Thumb
                    onPointerDown={() => setIsDragging(true)}
                    className={cn(
                        "block h-7 w-7 rounded-full border-2 border-neutral-700 bg-neutral-800 shadow-lg",
                        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
                        isAnimating && !isDragging && "!transition-all !duration-300 !ease-out",
                        "hover:scale-110 hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900",
                        "disabled:pointer-events-none disabled:opacity-50",
                        "cursor-grab active:cursor-grabbing",
                        // 3D effect: inset shadow by default (sitting in groove), lifts on active
                        "shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.5)]",
                        "active:-translate-y-1 active:shadow-[0_8px_16px_rgba(0,0,0,0.6)] active:border-purple-400"
                    )}
                >
                    {/* Inner detail for the thumb to look like a mechanical knob */}
                    <div className="absolute inset-1.5 rounded-full bg-neutral-700/50 shadow-inner" />
                </SliderPrimitive.Thumb>
            </SliderPrimitive.Root>
        </div>
    );
}
