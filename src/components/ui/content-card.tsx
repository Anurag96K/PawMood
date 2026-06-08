import { cn } from "@/lib/utils";
import React from "react";

interface ContentCardProps {
    children: React.ReactNode;
    className?: string;
    aspectSquare?: boolean;
    style?: React.CSSProperties;
}

/**
 * Shared card container component - matches the lock screen layout exactly.
 * Edge-to-edge, consistent rounding, shadow, and border.
 */
export function ContentCard({
    children,
    className,
    aspectSquare = true,
    style
}: ContentCardProps) {
    const shadowStyle = style?.boxShadow || '0 4px 24px rgba(255, 200, 170, 0.15), 0 2px 8px rgba(255, 180, 150, 0.08)';
    
    // Check if custom bg class is provided, otherwise use bg-card
    const hasBgClass = className && /\bbg-/.test(className);
    const hasBorderClass = className && /\bborder-/.test(className);

    return (
        <div
            className={cn(
                "relative w-full rounded-3xl",
                aspectSquare && "aspect-square",
                !hasBgClass && "bg-card", // Set bg-card on parent so shadow/corners blend perfectly
                className
            )}
            style={{
                boxShadow: shadowStyle,
                ...style,
            }}
        >
            <div 
                className={cn(
                    "w-full h-full rounded-3xl overflow-hidden bg-inherit",
                    !hasBorderClass && "border border-border/50"
                )}
            >
                {children}
            </div>
        </div>
    );
}

/**
 * Decorative corner brackets for the content card
 * Pass className to override border color (e.g., "border-background/60")
 */
export function ContentCardCorners({ className }: { className?: string }) {
    // Disabled decorative corner brackets as requested by the user
    return null;
}
