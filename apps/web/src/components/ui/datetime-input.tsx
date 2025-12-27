import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface DateTimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    className?: string;
    placeholder?: string;
}

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
    ({ className, placeholder = "Выберите дату и время", value, ...props }, ref) => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        const [hasValue, setHasValue] = React.useState(!!value);
        const [isPickerOpen, setIsPickerOpen] = React.useState(false);

        // Merge refs
        React.useImperativeHandle(ref, () => inputRef.current!);

        // Track value changes
        React.useEffect(() => {
            setHasValue(!!value);
        }, [value]);

        const handleTogglePicker = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (isPickerOpen) {
                // If picker is open, blur to close it
                inputRef.current?.blur();
                setIsPickerOpen(false);
            } else {
                // If picker is closed, open it
                if (inputRef.current) {
                    inputRef.current.showPicker?.();
                    setIsPickerOpen(true);
                }
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setHasValue(!!e.target.value);
            setIsPickerOpen(false); // Picker closes after selection
            props.onChange?.(e);
        };

        // Block keyboard input - only allow picking via calendar
        const handleKeyDown = (e: React.KeyboardEvent) => {
            // Allow Tab for accessibility
            if (e.key !== 'Tab') {
                e.preventDefault();
            }
        };

        // Track when picker closes via blur
        const handleBlur = () => {
            // Small delay to allow for click events to process first
            setTimeout(() => {
                setIsPickerOpen(false);
            }, 100);
        };

        return (
            <div className="relative w-full">
                <input
                    type="datetime-local"
                    ref={inputRef}
                    value={value}
                    onKeyDown={handleKeyDown}
                    onClick={handleTogglePicker}
                    onBlur={handleBlur}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-pointer select-none",
                        "[color-scheme:dark]",
                        // Completely hide the native calendar picker indicator
                        "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                        "[&::-webkit-datetime-edit-fields-wrapper]:p-0",
                        "[&::-webkit-inner-spin-button]:hidden [&::-webkit-inner-spin-button]:appearance-none",
                        "[&::-webkit-clear-button]:hidden [&::-webkit-clear-button]:appearance-none",
                        // Hide native text when no value
                        !hasValue && "[&::-webkit-datetime-edit]:opacity-0 [&::-webkit-datetime-edit-fields-wrapper]:opacity-0 caret-transparent",
                        className
                    )}
                    onChange={handleChange}
                    {...props}
                />

                {/* Placeholder text - shown only when no value */}
                {!hasValue && (
                    <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none"
                    >
                        {placeholder}
                    </span>
                )}

                {/* Custom Calendar Icon - Clickable, always at right edge */}
                <button
                    type="button"
                    onClick={handleTogglePicker}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
                    tabIndex={-1}
                    aria-label="Выбрать дату"
                >
                    <Calendar className="h-4 w-4" />
                </button>
            </div>
        );
    }
);

DateTimeInput.displayName = "DateTimeInput";

export { DateTimeInput };
