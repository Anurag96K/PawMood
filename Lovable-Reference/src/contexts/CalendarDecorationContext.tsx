import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CalendarTheme = "light" | "beige" | "spring" | "autumn" | "pawprint" | "cream" | "peach" | "softSand" | "warmIvory" | "mint" | "skyBlue" | "paleTeal" | "softLavender" | "warmGray" | "lightStone" | "springGreen" | "sage" | "lightMoss" | "paleAutumn" | "dustyRose" | "softClay" | "mutedButter" | "blush" | "serenity";
export type AccentColor = "coral" | "blue" | "green" | "purple" | "pink" | "amber" | "orange" | "peach" | "tangerine" | "yellow" | "gold" | "teal" | "cyan" | "skyBlue" | "indigo" | "violet" | "black" | "white" | "lightGray" | "darkGray" | "warmBeige" | "blush" | "mint" | "lilac" | "babyBlue" | "buttercream" | "terracotta" | "olive" | "dustyBlue" | "mauve" | "sage";
export type BorderColorMode = "auto" | AccentColor; // "auto" = mood-based, or specific accent color
export type IconStyle = "pawprint" | "emoji" | "dots";
export type DayStyle = "none" | "pawRing" | "gradientBorder" | "dashed" | "doubleLine" | "glow" | "dotted";
export type CalendarBackground = "none" | "pawPrint" | "pawPrintSoft" | "pawPrintPale" | "warmGradient" | "pastelBlur" | "bones" | "stars" | "rainbowDots";

// Calendar card background (solid pastel tints for the calendar surface)
// Near-white palette first, warm options at bottom for clear visual separation
export type CalendarCardBackground = 
  | "white"        // Pure white (default)
  | "softWhite"    // Slightly warm white
  | "cloudWhite"   // Very subtle gray tint
  | "pearlWhite"   // Soft pearl
  | "lightIvory"   // Very light ivory
  // Warm options (grouped at bottom)
  | "gentleCream"  // Gentle warm cream
  | "softWarmIvory"  // Soft warm ivory
  | "paleWarmCream"; // Pale warm cream

const ACCENT_COLOR_KEYS: AccentColor[] = ["coral", "blue", "green", "purple", "pink", "amber", "orange", "peach", "tangerine", "yellow", "gold", "teal", "cyan", "skyBlue", "indigo", "violet", "black", "white", "lightGray", "darkGray", "warmBeige", "blush", "mint", "lilac", "babyBlue", "buttercream", "terracotta", "olive", "dustyBlue", "mauve", "sage"];

const isValidAccentColor = (value: unknown): value is AccentColor =>
  ACCENT_COLOR_KEYS.includes(value as AccentColor);

const isValidBorderColorMode = (value: unknown): value is BorderColorMode =>
  value === "auto" || isValidAccentColor(value);

export interface DayDecoration {
  sticker?: string;
  note?: string;
  dayStyle?: DayStyle;
  borderColorOverride?: string; // HSL color string to override mood-based border
}

export interface CalendarDecorationSettings {
  theme: CalendarTheme;
  accentColor: AccentColor;
  borderColorMode: BorderColorMode; // "auto" for mood-based, or specific color for global override
  iconStyle: IconStyle;
  globalDayStyle: DayStyle;
  calendarBackground: CalendarBackground;
  calendarCardBackground: CalendarCardBackground; // New: solid background color for calendar card
  globalSticker?: string;
  dayDecorations: Record<string, DayDecoration>; // key format: "YYYY-MM-DD"
}

const defaultSettings: CalendarDecorationSettings = {
  theme: "beige",
  accentColor: "coral",
  borderColorMode: "auto", // Default to mood-based border colors
  iconStyle: "pawprint",
  globalDayStyle: "none",
  calendarBackground: "none",
  calendarCardBackground: "white", // Default white background
  globalSticker: undefined,
  dayDecorations: {},
};

interface CalendarDecorationContextValue {
  settings: CalendarDecorationSettings;
  updateTheme: (theme: CalendarTheme) => void;
  updateAccentColor: (color: AccentColor) => void;
  updateBorderColorMode: (mode: BorderColorMode) => void;
  updateIconStyle: (style: IconStyle) => void;
  updateGlobalDayStyle: (style: DayStyle) => void;
  updateCalendarBackground: (bg: CalendarBackground) => void;
  updateCalendarCardBackground: (bg: CalendarCardBackground) => void;
  updateGlobalSticker: (sticker: string | undefined) => void;
  setDayDecoration: (dateKey: string, decoration: DayDecoration) => void;
  removeDayDecoration: (dateKey: string) => void;
  getDayDecoration: (dateKey: string) => DayDecoration | undefined;
  resetToDefault: () => void;
}

const CalendarDecorationContext = createContext<CalendarDecorationContextValue | undefined>(undefined);

const STORAGE_KEY = "petmood-calendar-decorations";

export function CalendarDecorationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CalendarDecorationSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = { ...defaultSettings, ...JSON.parse(stored) } as any;

        // Sanitize stored values (older localStorage may have invalid/undefined values)
        if (!isValidAccentColor(parsed.accentColor)) {
          parsed.accentColor = defaultSettings.accentColor;
        }
        if (!isValidBorderColorMode(parsed.borderColorMode)) {
          parsed.borderColorMode = defaultSettings.borderColorMode;
        }

        // Clean up any sticker decorations on day 31 (bug fix)
        if (parsed.dayDecorations) {
          const cleanedDecorations = { ...parsed.dayDecorations };
          Object.keys(cleanedDecorations).forEach((key) => {
            if (key.endsWith("-31") && cleanedDecorations[key]?.sticker) {
              delete cleanedDecorations[key].sticker;
              // Remove the decoration entirely if empty
              if (
                Object.keys(cleanedDecorations[key]).filter(
                  (k) => cleanedDecorations[key][k as keyof (typeof cleanedDecorations)[typeof key]]
                ).length === 0
              ) {
                delete cleanedDecorations[key];
              }
            }
          });
          parsed.dayDecorations = cleanedDecorations;
        }

        return parsed as CalendarDecorationSettings;
      }
    } catch (e) {
      console.error("Failed to load calendar decoration settings:", e);
    }
    return defaultSettings;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save calendar decoration settings:", e);
    }
  }, [settings]);

  const updateTheme = (theme: CalendarTheme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const updateAccentColor = (accentColor: AccentColor) => {
    setSettings(prev => ({ ...prev, accentColor }));
  };

  const updateBorderColorMode = (borderColorMode: BorderColorMode) => {
    setSettings(prev => ({ ...prev, borderColorMode }));
  };

  const updateIconStyle = (iconStyle: IconStyle) => {
    setSettings(prev => ({ ...prev, iconStyle }));
  };

  const updateGlobalDayStyle = (globalDayStyle: DayStyle) => {
    setSettings(prev => ({ ...prev, globalDayStyle }));
  };

  const updateCalendarBackground = (calendarBackground: CalendarBackground) => {
    setSettings(prev => ({ ...prev, calendarBackground }));
  };

  const updateCalendarCardBackground = (calendarCardBackground: CalendarCardBackground) => {
    setSettings(prev => ({ ...prev, calendarCardBackground }));
  };

  const updateGlobalSticker = (globalSticker: string | undefined) => {
    setSettings(prev => ({ ...prev, globalSticker }));
  };

  const setDayDecoration = (dateKey: string, decoration: DayDecoration) => {
    setSettings(prev => ({
      ...prev,
      dayDecorations: {
        ...prev.dayDecorations,
        [dateKey]: { ...prev.dayDecorations[dateKey], ...decoration },
      },
    }));
  };

  const removeDayDecoration = (dateKey: string) => {
    setSettings(prev => {
      const newDecorations = { ...prev.dayDecorations };
      delete newDecorations[dateKey];
      return { ...prev, dayDecorations: newDecorations };
    });
  };

  const getDayDecoration = (dateKey: string) => {
    return settings.dayDecorations[dateKey];
  };

  const resetToDefault = () => {
    setSettings(defaultSettings);
  };

  return (
    <CalendarDecorationContext.Provider
      value={{
        settings,
        updateTheme,
        updateAccentColor,
        updateBorderColorMode,
        updateIconStyle,
        updateGlobalDayStyle,
        updateCalendarBackground,
        updateCalendarCardBackground,
        updateGlobalSticker,
        setDayDecoration,
        removeDayDecoration,
        getDayDecoration,
        resetToDefault,
      }}
    >
      {children}
    </CalendarDecorationContext.Provider>
  );
}

export function useCalendarDecoration() {
  const context = useContext(CalendarDecorationContext);
  if (!context) {
    throw new Error("useCalendarDecoration must be used within a CalendarDecorationProvider");
  }
  return context;
}

// Theme configurations - soft, light, calm tones
// Shadow colors are theme-matched: soft, warm, and cohesive with each background
// Layered shadows: Layer 1 = ambient (wide blur, low opacity), Layer 2 = contact (tight blur, higher opacity)
export const themeConfigs: Record<CalendarTheme, { name: string; bg: string; preview: string; shadow: string }> = {
  // Core themes
  light: { name: "White", bg: "bg-white", preview: "#ffffff", shadow: "0 8px 40px rgba(180, 170, 160, 0.22), 0 3px 12px rgba(160, 150, 140, 0.14)" },
  beige: { name: "Beige", bg: "bg-[hsl(30,30%,97%)]", preview: "#faf8f5", shadow: "0 10px 45px rgba(200, 185, 165, 0.26), 0 4px 14px rgba(185, 170, 150, 0.16)" },
  spring: { name: "Spring", bg: "bg-gradient-to-b from-green-50 to-emerald-50", preview: "#ecfdf5", shadow: "0 8px 40px rgba(134, 190, 150, 0.26), 0 3px 12px rgba(120, 180, 140, 0.16)" },
  autumn: { name: "Autumn", bg: "bg-gradient-to-b from-orange-50 to-amber-50", preview: "#fff7ed", shadow: "0 10px 45px rgba(220, 160, 100, 0.28), 0 4px 14px rgba(200, 150, 100, 0.18)" },
  // Warm soft tones
  cream: { name: "Cream", bg: "bg-[hsl(40,40%,96%)]", preview: "#faf6ef", shadow: "0 8px 42px rgba(210, 180, 130, 0.26), 0 3px 12px rgba(200, 170, 120, 0.16)" },
  peach: { name: "Peach", bg: "bg-[hsl(25,60%,95%)]", preview: "#fef0e6", shadow: "0 10px 45px rgba(240, 170, 140, 0.28), 0 4px 14px rgba(230, 160, 130, 0.18)" },
  softSand: { name: "Soft Sand", bg: "bg-[hsl(35,35%,94%)]", preview: "#f5f0e8", shadow: "0 8px 42px rgba(190, 170, 140, 0.26), 0 3px 12px rgba(180, 160, 130, 0.16)" },
  warmIvory: { name: "Ivory", bg: "bg-[hsl(45,50%,97%)]", preview: "#fdfaf3", shadow: "0 8px 42px rgba(200, 180, 140, 0.24), 0 3px 12px rgba(190, 170, 130, 0.14)" },
  // Cool soft tones
  mint: { name: "Mint", bg: "bg-[hsl(150,30%,95%)]", preview: "#eef8f4", shadow: "0 8px 42px rgba(140, 190, 170, 0.26), 0 3px 12px rgba(130, 180, 160, 0.16)" },
  skyBlue: { name: "Sky Blue", bg: "bg-[hsl(200,40%,96%)]", preview: "#eff7fc", shadow: "0 8px 42px rgba(150, 180, 200, 0.26), 0 3px 12px rgba(140, 170, 190, 0.16)" },
  paleTeal: { name: "Pale Teal", bg: "bg-[hsl(175,25%,94%)]", preview: "#ecf5f3", shadow: "0 8px 42px rgba(140, 180, 175, 0.26), 0 3px 12px rgba(130, 170, 165, 0.16)" },
  softLavender: { name: "Lavender", bg: "bg-[hsl(260,30%,96%)]", preview: "#f4f2f9", shadow: "0 8px 42px rgba(180, 160, 200, 0.26), 0 3px 12px rgba(170, 150, 190, 0.16)" },
  // Neutral tones
  warmGray: { name: "Warm Gray", bg: "bg-[hsl(30,8%,95%)]", preview: "#f4f3f1", shadow: "0 8px 42px rgba(160, 155, 150, 0.26), 0 3px 12px rgba(150, 145, 140, 0.16)" },
  lightStone: { name: "Light Stone", bg: "bg-[hsl(40,12%,93%)]", preview: "#f0eee9", shadow: "0 8px 42px rgba(175, 165, 150, 0.26), 0 3px 12px rgba(165, 155, 140, 0.16)" },
  // Nature-inspired soft tones
  springGreen: { name: "Spring", bg: "bg-[hsl(120,25%,95%)]", preview: "#eff7ef", shadow: "0 8px 42px rgba(140, 180, 140, 0.26), 0 3px 12px rgba(130, 170, 130, 0.16)" },
  sage: { name: "Sage", bg: "bg-[hsl(140,18%,93%)]", preview: "#ebf2ea", shadow: "0 8px 42px rgba(140, 170, 145, 0.26), 0 3px 12px rgba(130, 160, 135, 0.16)" },
  lightMoss: { name: "Light Moss", bg: "bg-[hsl(100,20%,94%)]", preview: "#f0f5eb", shadow: "0 8px 42px rgba(150, 175, 140, 0.26), 0 3px 12px rgba(140, 165, 130, 0.16)" },
  paleAutumn: { name: "Pale Autumn", bg: "bg-[hsl(28,40%,95%)]", preview: "#f9f2ea", shadow: "0 10px 45px rgba(200, 165, 130, 0.28), 0 4px 14px rgba(190, 155, 120, 0.18)" },
  // Cozy muted tones
  dustyRose: { name: "Dusty Rose", bg: "bg-[hsl(350,25%,95%)]", preview: "#f9f0f1", shadow: "0 8px 42px rgba(200, 160, 165, 0.26), 0 3px 12px rgba(190, 150, 155, 0.16)" },
  softClay: { name: "Soft Clay", bg: "bg-[hsl(15,30%,94%)]", preview: "#f6efe9", shadow: "0 8px 42px rgba(195, 165, 145, 0.26), 0 3px 12px rgba(185, 155, 135, 0.16)" },
  mutedButter: { name: "Butter", bg: "bg-[hsl(50,45%,95%)]", preview: "#faf7e8", shadow: "0 8px 42px rgba(200, 185, 130, 0.24), 0 3px 12px rgba(190, 175, 120, 0.14)" },
  blush: { name: "Blush", bg: "bg-[hsl(10,35%,96%)]", preview: "#faf3f0", shadow: "0 8px 42px rgba(210, 170, 160, 0.26), 0 3px 12px rgba(200, 160, 150, 0.16)" },
  serenity: { name: "Serenity", bg: "bg-[hsl(210,30%,96%)]", preview: "#f2f5fa", shadow: "0 8px 42px rgba(160, 175, 200, 0.26), 0 3px 12px rgba(150, 165, 190, 0.16)" },
  // Pattern theme (at the end)
  pawprint: { name: "Pawprints", bg: "bg-[hsl(30,20%,96%)]", preview: "#f5f3f0", shadow: "0 8px 42px rgba(200, 175, 150, 0.26), 0 3px 12px rgba(190, 165, 140, 0.16)" },
};

// Expanded accent color options (20-30 colors)
export const accentColorConfigs: Record<AccentColor, { name: string; color: string; hsl: string }> = {
  // Original colors
  coral: { name: "Coral", color: "bg-[hsl(18,85%,52%)]", hsl: "18 85% 52%" },
  blue: { name: "Ocean", color: "bg-blue-500", hsl: "217 91% 60%" },
  green: { name: "Forest", color: "bg-emerald-500", hsl: "160 84% 39%" },
  purple: { name: "Lavender", color: "bg-purple-500", hsl: "271 76% 53%" },
  pink: { name: "Rose", color: "bg-pink-500", hsl: "330 81% 60%" },
  amber: { name: "Honey", color: "bg-amber-500", hsl: "38 92% 50%" },
  // Warm colors
  orange: { name: "Orange", color: "bg-orange-500", hsl: "25 95% 53%" },
  peach: { name: "Peach", color: "bg-[hsl(20,80%,70%)]", hsl: "20 80% 70%" },
  tangerine: { name: "Tangerine", color: "bg-[hsl(30,90%,55%)]", hsl: "30 90% 55%" },
  yellow: { name: "Sunshine", color: "bg-yellow-400", hsl: "45 93% 58%" },
  gold: { name: "Gold", color: "bg-[hsl(45,85%,50%)]", hsl: "45 85% 50%" },
  // Cool colors
  teal: { name: "Teal", color: "bg-teal-500", hsl: "175 77% 40%" },
  cyan: { name: "Cyan", color: "bg-cyan-500", hsl: "188 85% 48%" },
  skyBlue: { name: "Sky", color: "bg-sky-400", hsl: "199 89% 65%" },
  indigo: { name: "Indigo", color: "bg-indigo-500", hsl: "239 84% 67%" },
  violet: { name: "Violet", color: "bg-violet-500", hsl: "258 90% 66%" },
  // Neutrals
  black: { name: "Black", color: "bg-neutral-900", hsl: "0 0% 10%" },
  white: { name: "White", color: "bg-white", hsl: "0 0% 100%" },
  lightGray: { name: "Light Gray", color: "bg-neutral-300", hsl: "0 0% 78%" },
  darkGray: { name: "Dark Gray", color: "bg-neutral-600", hsl: "0 0% 40%" },
  warmBeige: { name: "Warm Beige", color: "bg-[hsl(35,30%,75%)]", hsl: "35 30% 75%" },
  // Soft pastels
  blush: { name: "Blush", color: "bg-[hsl(350,60%,78%)]", hsl: "350 60% 78%" },
  mint: { name: "Mint", color: "bg-[hsl(160,50%,70%)]", hsl: "160 50% 70%" },
  lilac: { name: "Lilac", color: "bg-[hsl(280,45%,75%)]", hsl: "280 45% 75%" },
  babyBlue: { name: "Baby Blue", color: "bg-[hsl(200,70%,78%)]", hsl: "200 70% 78%" },
  buttercream: { name: "Buttercream", color: "bg-[hsl(48,70%,78%)]", hsl: "48 70% 78%" },
  // Deeper muted tones
  terracotta: { name: "Terracotta", color: "bg-[hsl(18,50%,55%)]", hsl: "18 50% 55%" },
  olive: { name: "Olive", color: "bg-[hsl(85,35%,45%)]", hsl: "85 35% 45%" },
  dustyBlue: { name: "Dusty Blue", color: "bg-[hsl(210,35%,55%)]", hsl: "210 35% 55%" },
  mauve: { name: "Mauve", color: "bg-[hsl(320,25%,55%)]", hsl: "320 25% 55%" },
  sage: { name: "Sage", color: "bg-[hsl(140,25%,55%)]", hsl: "140 25% 55%" },
};

export const iconStyleConfigs: Record<IconStyle, { name: string; preview: string }> = {
  pawprint: { name: "Pawprints", preview: "🐾" },
  emoji: { name: "Emojis", preview: "😊" },
  dots: { name: "Minimal Dots", preview: "●" },
};

export const dayStyleConfigs: Record<DayStyle, { name: string; preview: string; description: string }> = {
  none: { name: "None", preview: "○", description: "No decoration" },
  pawRing: { name: "Paw Ring", preview: "🐾", description: "Pawprint border" },
  gradientBorder: { name: "Gradient", preview: "◐", description: "Orange gradient" },
  dashed: { name: "Dashed", preview: "┅", description: "Dashed border" },
  doubleLine: { name: "Double", preview: "◎", description: "Double border" },
  glow: { name: "Glow", preview: "✨", description: "Soft glow effect" },
  dotted: { name: "Dotted", preview: "⋯", description: "Dotted border" },
};

// Calendar background configurations
export const calendarBackgroundConfigs: Record<CalendarBackground, { 
  name: string; 
  preview: string; 
  description: string;
  css: React.CSSProperties;
}> = {
  none: { 
    name: "None", 
    preview: "○", 
    description: "No pattern",
    css: {}
  },
  pawPrint: { 
    name: "Paw Prints", 
    preview: "🐾", 
    description: "Bright paws",
    css: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23d4a574' opacity='0.15'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '60px 60px'
    }
  },
  pawPrintSoft: { 
    name: "Soft Paws", 
    preview: "🐾", 
    description: "Gentle paws",
    css: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 60 60'%3E%3Cg fill='%23c9a882' opacity='0.08'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '50px 50px'
    }
  },
  pawPrintPale: { 
    name: "Pale Paws", 
    preview: "🐾", 
    description: "Very subtle",
    css: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 60 60'%3E%3Cg fill='%23e8ddd0' opacity='0.12'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '40px 40px'
    }
  },
  warmGradient: { 
    name: "Warm Mist", 
    preview: "🌅", 
    description: "Orange glow",
    css: {
      background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 180, 120, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255, 200, 150, 0.1) 0%, transparent 50%)'
    }
  },
  pastelBlur: { 
    name: "Pastel Blur", 
    preview: "🎨", 
    description: "Cozy blend",
    css: {
      background: 'radial-gradient(ellipse at 20% 30%, rgba(255, 218, 185, 0.15) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(255, 228, 196, 0.12) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(255, 239, 213, 0.08) 0%, transparent 60%)'
    }
  },
  bones: { 
    name: "Bones", 
    preview: "🦴", 
    description: "Cute bones",
    css: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cg fill='%23d4a574' opacity='0.1'%3E%3Cellipse cx='10' cy='25' rx='6' ry='4'/%3E%3Cellipse cx='40' cy='25' rx='6' ry='4'/%3E%3Crect x='12' y='22' width='26' height='6' rx='3'/%3E%3Cellipse cx='10' cy='25' rx='4' ry='6'/%3E%3Cellipse cx='40' cy='25' rx='4' ry='6'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '50px 50px'
    }
  },
  stars: { 
    name: "Stars", 
    preview: "⭐", 
    description: "Sparkly",
    css: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23e8b860' opacity='0.1'%3E%3Cpolygon points='30,5 35,20 50,20 38,30 42,45 30,36 18,45 22,30 10,20 25,20'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '60px 60px'
    }
  },
  rainbowDots: { 
    name: "Rainbow", 
    preview: "🌈", 
    description: "Playful dots",
    css: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='20' cy='20' r='4' fill='%23ffb3ba' opacity='0.15'/%3E%3Ccircle cx='60' cy='20' r='3' fill='%23bae1ff' opacity='0.12'/%3E%3Ccircle cx='40' cy='40' r='5' fill='%23baffc9' opacity='0.1'/%3E%3Ccircle cx='20' cy='60' r='3' fill='%23ffffba' opacity='0.12'/%3E%3Ccircle cx='60' cy='60' r='4' fill='%23ffdfba' opacity='0.15'/%3E%3C/svg%3E")`,
      backgroundSize: '80px 80px'
    }
  },
};

// Calendar card background color configurations (near-white palette)
// Clean whites at top, warm options grouped at bottom for clear separation
export const calendarCardBackgroundConfigs: Record<CalendarCardBackground, { 
  name: string; 
  hsl: string;  // HSL color value
  preview: string; // Preview color for selector
}> = {
  // Clean white variations (top)
  white: { 
    name: "Pure White", 
    hsl: "0 0% 100%",
    preview: "#ffffff"
  },
  softWhite: { 
    name: "Soft White", 
    hsl: "30 8% 99%",
    preview: "#fefefd"
  },
  cloudWhite: { 
    name: "Cloud White", 
    hsl: "210 8% 98%",
    preview: "#fafafb"
  },
  pearlWhite: { 
    name: "Pearl White", 
    hsl: "45 6% 98%",
    preview: "#fbfbf9"
  },
  lightIvory: { 
    name: "Light Ivory", 
    hsl: "48 10% 97%",
    preview: "#faf9f5"
  },
  // Warm options (bottom - subtle, not beige-heavy)
  gentleCream: { 
    name: "Gentle Cream", 
    hsl: "38 16% 97%",
    preview: "#fbf9f4"
  },
  softWarmIvory: { 
    name: "Soft Warm Ivory", 
    hsl: "42 14% 97%",
    preview: "#faf9f3"
  },
  paleWarmCream: { 
    name: "Pale Warm Cream", 
    hsl: "35 18% 97%",
    preview: "#fcf9f3"
  },
};

// Cute pattern-style sticker options (minimal, soft, works well as background patterns)
export const stickerOptions = [
  // Paw prints & pets
  "🐾", "🐕", "🐈", "🐶", "🐱", "🐰",
  // Hearts & love
  "💗", "💕", "🤍", "🩷", "❤️",
  // Stars & sparkles
  "⭐", "✨", "🌟", "💫",
  // Nature & flowers
  "🌸", "🌷", "🌼", "🌻", "🍀", "🌿",
  // Soft shapes
  "☁️", "🌙", "☀️", "🦋",
];
