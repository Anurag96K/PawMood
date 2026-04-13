import { useEffect, useState, forwardRef } from "react";

interface CountUpNumberProps {
    value: number;
    duration?: number;
    suffix?: string;
    className?: string;
}

export const CountUpNumber = forwardRef<HTMLSpanElement, CountUpNumberProps>(
    function CountUpNumber({
        value,
        duration = 1500,
        suffix = "",
        className = ""
    }, ref) {
        const [displayValue, setDisplayValue] = useState(0);

        useEffect(() => {
            const startTime = Date.now();
            const startValue = 0;

            const animate = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(startValue + (value - startValue) * easeOut);

                setDisplayValue(current);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }, [value, duration]);

        return (
            <span ref={ref} className={className}>
                {displayValue}{suffix}
            </span>
        );
    }
);
