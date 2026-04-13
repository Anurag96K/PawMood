import { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleEffect } from "@/components/report/ParticleEffect";
import { useLanguage } from "@/contexts/LanguageContext";

// Pastel birthday confetti colors
const BIRTHDAY_CONFETTI_COLORS = [
    "hsl(340 55% 75% / 0.7)",
    "hsl(340 50% 80% / 0.65)",
    "hsl(25 55% 78% / 0.7)",
    "hsl(25 50% 82% / 0.65)",
    "hsl(270 45% 78% / 0.7)",
    "hsl(270 40% 82% / 0.65)",
];

// High-quality SVG cake component
const BirthdayCakeSVG = () => (
    <svg
        width="76"
        height="76"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
    >
        <rect x="8" y="40" width="48" height="16" rx="4" fill="hsl(30 55% 88%)" />
        <rect x="8" y="40" width="48" height="4" rx="2" fill="hsl(340 50% 85%)" />
        <rect x="14" y="28" width="36" height="14" rx="3" fill="hsl(30 50% 90%)" />
        <rect x="14" y="28" width="36" height="3" rx="1.5" fill="hsl(270 40% 88%)" />
        <rect x="20" y="18" width="24" height="12" rx="2.5" fill="hsl(340 45% 92%)" />
        <rect x="20" y="18" width="24" height="2.5" rx="1.25" fill="hsl(25 50% 88%)" />
        <ellipse cx="16" cy="40" rx="2.5" ry="4" fill="hsl(340 50% 85%)" />
        <ellipse cx="32" cy="40" rx="3" ry="5" fill="hsl(340 50% 85%)" />
        <ellipse cx="48" cy="40" rx="2.5" ry="4" fill="hsl(340 50% 85%)" />
        <rect x="30" y="6" width="4" height="14" rx="1.5" fill="hsl(270 45% 85%)" />
        <rect x="30" y="6" width="4" height="3" rx="1" fill="hsl(270 40% 90%)" />
        <ellipse cx="32" cy="4" rx="2.5" ry="4" fill="hsl(35 90% 70%)" />
        <ellipse cx="32" cy="3.5" rx="1.5" ry="2.5" fill="hsl(45 95% 80%)" />
        <circle cx="18" cy="47" r="1.5" fill="hsl(270 40% 85%)" />
        <circle cx="32" cy="47" r="1.5" fill="hsl(270 40% 85%)" />
        <circle cx="46" cy="47" r="1.5" fill="hsl(270 40% 85%)" />
        <circle cx="25" cy="34" r="1.2" fill="hsl(340 45% 82%)" />
        <circle cx="39" cy="34" r="1.2" fill="hsl(340 45% 82%)" />
    </svg>
);

const BalloonLeftSVG = () => (
    <svg width="24" height="42" viewBox="0 0 24 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <ellipse cx="12" cy="14" rx="10" ry="13" fill="hsl(340 50% 88% / 0.85)" />
        <path d="M12,27 L12,40" stroke="hsl(340 40% 72% / 0.6)" strokeWidth="1" />
        <polygon points="10,27 14,27 12,30" fill="hsl(340 48% 80%)" />
    </svg>
);

const BalloonRightSVG = () => (
    <svg width="24" height="42" viewBox="0 0 24 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
        <ellipse cx="12" cy="14" rx="10" ry="13" fill="hsl(270 45% 88% / 0.85)" />
        <path d="M12,27 L12,40" stroke="hsl(270 38% 72% / 0.6)" strokeWidth="1" />
        <polygon points="10,27 14,27 12,30" fill="hsl(270 42% 80%)" />
    </svg>
);

interface BirthdayModalProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
}

export function BirthdayModal({ isOpen, onClose, petName }: BirthdayModalProps) {
    const { language } = useLanguage();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setShowConfetti(true), 100);
            return () => clearTimeout(timer);
        } else {
            setShowConfetti(false);
        }
    }, [isOpen]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isOpen]);

    const getBirthdayMessage = () => {
        const messages: Record<string, string> = {
            ko: "생일 축하해요!",
            en: "Happy Birthday!",
            ja: "お誕生日おめでとう!",
            zh: "生日快乐!",
            es: "¡Feliz Cumpleaños!",
            fr: "Joyeux Anniversaire!",
            de: "Alles Gute zum Geburtstag!",
        };
        return messages[language] || messages.en;
    };

    const getSubMessage = () => {
        if (!petName) return "";
        const messages: Record<string, string> = {
            ko: `${petName}의 특별한 날이에요!`,
            en: `It's ${petName}'s special day!`,
            ja: `${petName}の特別な日です!`,
            zh: `今天是${petName}的特别日子!`,
            es: `¡Es el día especial de ${petName}!`,
            fr: `C'est le jour spécial de ${petName}!`,
            de: `Es ist ${petName}s besonderer Tag!`,
        };
        return messages[language] || messages.en;
    };

    // Standard font size for submessage as per latest requirement
    const subMessageFontSize = 14;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <ParticleEffect isActive={showConfetti} colorPalette={BIRTHDAY_CONFETTI_COLORS} />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div
                            className="relative w-full max-w-[320px] rounded-2xl overflow-hidden pointer-events-auto p-6 text-center"
                            style={{
                                background: "linear-gradient(180deg, hsl(30 50% 98%) 0%, hsl(340 45% 97%) 100%)",
                                boxShadow: "0 25px 50px -12px hsl(340 50% 50% / 0.18), 0 12px 24px -8px hsl(30 50% 50% / 0.1)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm border border-border/30 z-10">
                                <X className="w-4 h-4 text-foreground/70" />
                            </button>

                            <div className="flex justify-center items-end gap-3 mb-4">
                                <div className="animate-bounce" style={{ animationDuration: "2s" }}><BalloonLeftSVG /></div>
                                <div className="animate-bounce" style={{ animationDuration: "1.5s" }}><BirthdayCakeSVG /></div>
                                <div className="animate-bounce" style={{ animationDuration: "2.2s" }}><BalloonRightSVG /></div>
                            </div>

                            <h2 className="text-2xl font-black mb-2" style={{ background: "linear-gradient(135deg, hsl(340 58% 60%) 0%, hsl(25 62% 58%) 50%, hsl(270 48% 62%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                {getBirthdayMessage()}
                            </h2>

                            {petName && (
                                <p
                                    className="font-bold flex flex-wrap items-center justify-center gap-1 mt-2 px-4 text-center leading-relaxed"
                                    style={{
                                        color: "hsl(340 35% 68%)",
                                        fontSize: `${subMessageFontSize}px`,
                                    }}
                                >
                                    {getSubMessage()} ✨
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
