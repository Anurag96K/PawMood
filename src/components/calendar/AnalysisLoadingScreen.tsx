import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AnalysisLoadingScreenProps {
    remainingCredits: number;
}

export function AnalysisLoadingScreen({ remainingCredits }: AnalysisLoadingScreenProps) {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* Background with the original pinkish swirl aesthetic */}
            <div
                className="absolute inset-0 bg-[#FFF5F5]"
                style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 182, 193, 0.4) 0%, rgba(255, 255, 255, 0) 70%), 
                           url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 50 Q25 0 50 50 T100 50' fill='none' stroke='%23ffb6c1' stroke-width='1' opacity='0.2'/%3E%3Cpath d='M0 70 Q25 20 50 70 T100 70' fill='none' stroke='%23ffb6c1' stroke-width='1' opacity='0.2'/%3E%3C/svg%3E")`,
                    backgroundSize: '300% 300%',
                }}
            />

            {/* Animating swirl effect (subtle) */}
            <motion.div
                className="absolute inset-0 opacity-20 pointer-events-none"
                animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#ffb6c1_0%,_transparent_70%)]" />
            </motion.div>

            <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
                {/* Credit Indicator - Based on Image 1 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-white/60 backdrop-blur-md rounded-full shadow-sm mb-12 border border-white/50"
                >
                    <Zap className="w-3.5 h-3.5 text-[#F26322] fill-[#F26322]" />
                    <span className="text-xs font-bold text-[#F26322]">
                        {remainingCredits} total remaining
                    </span>
                </motion.div>

                {/* Brand and Logo */}
                <div className="flex flex-col items-center gap-1 mb-8">
                    <h1 className="text-4xl font-black text-[#432C23] tracking-tighter">
                        PetMood
                    </h1>
                    <p className="text-[10px] font-extrabold text-[#8E7B74] uppercase tracking-[0.2em]">
                        AI Pet Analysis
                    </p>
                </div>

                {/* Animated Paws */}
                <div className="flex items-center gap-4 mb-8">
                    <motion.span
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, -10, 0]
                        }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                        className="text-4xl"
                    >
                        🐾
                    </motion.span>
                    <motion.span
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, 10, 0]
                        }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                        className="text-4xl"
                    >
                        🐾
                    </motion.span>
                </div>

                {/* Loading Text */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-[#432C23]">
                        {t("analyzing") || "Analyzing mood..."}
                    </h3>
                    <p className="text-sm text-[#8E7B74] mt-1 font-medium">
                        This won't take long
                    </p>
                </div>

                {/* Progress Bar - Smooth fill */}
                <div className="w-full h-1.5 bg-[#432C23]/5 rounded-full overflow-hidden border border-[#432C23]/10">
                    <motion.div
                        className="h-full bg-[#F26322]"
                        initial={{ width: "0%" }}
                        animate={{ width: "95%" }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </div>
    );
}
