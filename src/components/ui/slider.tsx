import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center py-4", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-secondary/40 shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300 ease-out" />
      {/* Tick marks for 5 positions */}
      <div className="absolute inset-0 flex justify-between px-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-0.5 h-full bg-background/60 rounded-full" />
        ))}
      </div>
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-3 border-primary bg-background shadow-lg ring-offset-background transition-all duration-200 ease-out hover:scale-125 hover:shadow-[0_0_12px_hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:scale-110 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-105" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
