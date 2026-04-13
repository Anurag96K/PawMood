// Shared mood theme mapping used by both AnalysisCard and CalendarDayCell.
// Keeping this centralized ensures colors stay IDENTICAL across the UI.

export interface MoodTheme {
  bg: string;
  glow: string;
  border: string;
  borderLight: string;
  pillBg: string;
  pillBorder: string;
  pillGlow: string;
  emojiGlow: string;
  buttonBorder: string;
  imageBorder: string;
  progressFill: string;
}

// NOTE: These class strings are intentionally kept as literals so Tailwind can statically detect them.
export const getMoodTheme = (mood: string): MoodTheme => {
  const moodLower = (mood || "").toLowerCase();

  // Calm/Relaxed/Peaceful → Teal
  if (
    moodLower.includes("calm") ||
    moodLower.includes("relaxed") ||
    moodLower.includes("peaceful")
  ) {
    return {
      bg: "bg-gradient-to-b from-teal-50/50 to-teal-100/30",
      glow: "0 0 60px 20px rgba(94, 234, 212, 0.15)",
      border: "border-teal-300/60",
      borderLight: "border-teal-200/50",
      pillBg: "bg-teal-50",
      pillBorder: "border-teal-300",
      pillGlow: "0 0 12px 2px rgba(94, 234, 212, 0.35)",
      emojiGlow: "0 0 16px 3px rgba(94, 234, 212, 0.4)",
      buttonBorder: "border-teal-300/40",
      imageBorder: "border-teal-300/30",
      progressFill: "bg-teal-400",
    };
  }

  // Happy/Playful/Excited → Amber
  if (
    moodLower.includes("happy") ||
    moodLower.includes("playful") ||
    moodLower.includes("excited")
  ) {
    return {
      bg: "bg-gradient-to-b from-amber-50/50 to-orange-100/30",
      glow: "0 0 60px 20px rgba(251, 191, 36, 0.15)",
      border: "border-amber-300/60",
      borderLight: "border-amber-200/50",
      pillBg: "bg-amber-50",
      pillBorder: "border-amber-300",
      pillGlow: "0 0 12px 2px rgba(251, 191, 36, 0.35)",
      emojiGlow: "0 0 16px 3px rgba(251, 191, 36, 0.4)",
      buttonBorder: "border-amber-300/40",
      imageBorder: "border-amber-300/30",
      progressFill: "bg-amber-400",
    };
  }

  // Moody/Anxious/Sad → Purple
  if (
    moodLower.includes("moody") ||
    moodLower.includes("anxious") ||
    moodLower.includes("sad")
  ) {
    return {
      bg: "bg-gradient-to-b from-purple-50/50 to-purple-100/30",
      glow: "0 0 60px 20px rgba(192, 132, 252, 0.15)",
      border: "border-purple-300/60",
      borderLight: "border-purple-200/50",
      pillBg: "bg-purple-50",
      pillBorder: "border-purple-300",
      pillGlow: "0 0 12px 2px rgba(192, 132, 252, 0.35)",
      emojiGlow: "0 0 16px 3px rgba(192, 132, 252, 0.4)",
      buttonBorder: "border-purple-300/40",
      imageBorder: "border-purple-300/30",
      progressFill: "bg-purple-400",
    };
  }

  // Default warm orange
  return {
    bg: "bg-gradient-to-b from-orange-50/50 to-orange-100/30",
    glow: "0 0 60px 20px rgba(251, 146, 60, 0.15)",
    border: "border-orange-300/60",
    borderLight: "border-orange-200/50",
    pillBg: "bg-orange-50",
    pillBorder: "border-orange-300",
    pillGlow: "0 0 12px 2px rgba(251, 146, 60, 0.35)",
    emojiGlow: "0 0 16px 3px rgba(251, 146, 60, 0.4)",
    buttonBorder: "border-orange-300/40",
    imageBorder: "border-orange-300/30",
    progressFill: "bg-orange-400",
  };
};
