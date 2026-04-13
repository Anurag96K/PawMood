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
    return (
        <div
            className={cn(
                "relative w-full rounded-3xl bg-card overflow-hidden border border-border/50",
                aspectSquare && "aspect-square",
                className
            )}
            style={{
                boxShadow: style?.boxShadow || '0 4px 24px rgba(255, 200, 170, 0.15), 0 2px 8px rgba(255, 180, 150, 0.08)',
                ...style
            }}
        >
            {children}
        </div>
    );
}

/**
 * Decorative corner brackets for the content card
 * Pass className to override border color (e.g., "border-background/60")
 */
export function ContentCardCorners({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 pointer-events-none", className)}>
            <div className="absolute top-4 left-4 w-10 h-10 border-l-[3px] border-t-[3px] border-primary/25 rounded-tl-2xl" />
            <div className="absolute top-4 right-4 w-10 h-10 border-r-[3px] border-t-[3px] border-primary/25 rounded-tr-2xl" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-[3px] border-b-[3px] border-primary/25 rounded-bl-2xl" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-[3px] border-b-[3px] border-primary/25 rounded-br-2xl" />
        </div>
    );
}
