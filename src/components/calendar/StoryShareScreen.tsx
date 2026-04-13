import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Download, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { AnalysisCardData } from "./AnalysisCard";
import { getMoodTheme } from "@/lib/moodTheme";

interface StoryShareScreenProps {
    isOpen: boolean;
    onClose: () => void;
    data: AnalysisCardData;
    date: string;
    petName?: string;
}

export function StoryShareScreen({
    isOpen,
    onClose,
    data,
    date,
    petName = "My Pet",
}: StoryShareScreenProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [dominantColor, setDominantColor] = useState<string>("hsl(30, 30%, 96%)");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Extract dominant color from image
    useEffect(() => {
        if (!data.imageUrl || !isOpen) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            try {
                const imageData = ctx.getImageData(0, 0, 50, 50).data;
                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < imageData.length; i += 4) {
                    r += imageData[i];
                    g += imageData[i + 1];
                    b += imageData[i + 2];
                    count++;
                }

                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);

                const max = Math.max(r, g, b) / 255;
                const min = Math.min(r, g, b) / 255;
                const l = (max + min) / 2;

                let h = 0;
                let s = 0;

                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

                    const rNorm = r / 255;
                    const gNorm = g / 255;
                    const bNorm = b / 255;

                    if (max === rNorm) {
                        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
                    } else if (max === gNorm) {
                        h = ((bNorm - rNorm) / d + 2) / 6;
                    } else {
                        h = ((rNorm - gNorm) / d + 4) / 6;
                    }
                }

                const bgH = Math.round(h * 360);
                const bgS = Math.round(Math.min(s * 100 * 0.6, 40));
                const bgL = Math.round(Math.min(l * 100 * 0.3 + 10, 25));

                setDominantColor(`hsl(${bgH}, ${bgS}%, ${bgL}%)`);
            } catch {
                setDominantColor("hsl(30, 20%, 15%)");
            }
        };
        img.src = data.imageUrl;
    }, [data.imageUrl, isOpen]);

    const moodStyles = getMoodTheme(data.mood);

    const handleClose = useCallback(() => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    }, [isClosing, onClose]);

    const generateStoryImage = useCallback(async (): Promise<Blob | null> => {
        try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            canvas.width = 1080;
            canvas.height = 1920;

            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, dominantColor);
            bgGradient.addColorStop(0.5, adjustColorLightness(dominantColor, -5));
            bgGradient.addColorStop(1, adjustColorLightness(dominantColor, -10));
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cardWidth = 800;
            const cardHeight = 950;
            const cardX = (canvas.width - cardWidth) / 2;
            const cardY = (canvas.height - cardHeight) / 2;
            const cardRadius = 48;

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
            ctx.shadowBlur = 80;
            ctx.shadowOffsetY = 30;

            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
            ctx.fill();
            ctx.restore();

            if (data.imageUrl) {
                const img = new Image();
                img.crossOrigin = "anonymous";

                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error("Failed to load image"));
                    img.src = data.imageUrl;
                });

                const imgSize = 280;
                const imgX = canvas.width / 2;
                const imgY = cardY + 200;

                ctx.save();
                ctx.beginPath();
                ctx.arc(imgX, imgY, imgSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(img, imgX - imgSize / 2, imgY - imgSize / 2, imgSize, imgSize);
                ctx.restore();

                ctx.strokeStyle = "rgba(249, 115, 22, 0.25)";
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(imgX, imgY, imgSize / 2 + 6, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.fillStyle = "#6B7280";
            ctx.font = "500 32px system-ui, -apple-system, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(date, canvas.width / 2, cardY + 380);

            ctx.font = "90px system-ui";
            ctx.fillText(data.moodEmoji, canvas.width / 2, cardY + 510);

            ctx.fillStyle = "#1A1A1A";
            ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
            ctx.fillText(data.mood, canvas.width / 2, cardY + 620);

            ctx.fillStyle = "#F97316";
            ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
            ctx.fillText(`${data.confidence}% confidence`, canvas.width / 2, cardY + 690);

            ctx.fillStyle = "#6B7280";
            ctx.font = "28px system-ui, -apple-system, sans-serif";
            const maxWidth = cardWidth - 80;
            const description =
                data.moodDescription.length > 100
                    ? data.moodDescription.substring(0, 97) + "..."
                    : data.moodDescription;

            const words = description.split(" ");
            let line = "";
            let lineY = cardY + 760;
            const lineHeight = 40;

            for (const word of words) {
                const testLine = line + word + " ";
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== "") {
                    ctx.fillText(line.trim(), canvas.width / 2, lineY);
                    line = word + " ";
                    lineY += lineHeight;
                    if (lineY > cardY + 880) break;
                } else {
                    line = testLine;
                }
            }
            if (line && lineY <= cardY + 880) {
                ctx.fillText(line.trim(), canvas.width / 2, lineY);
            }

            ctx.fillStyle = "#9CA3AF";
            ctx.font = "28px system-ui, -apple-system, sans-serif";
            ctx.fillText(`${petName}'s Mood Analysis`, canvas.width / 2, cardY + cardHeight - 50);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/png", 1.0);
            });

            return blob;
        } catch (error) {
            console.error("Error generating story image:", error);
            return null;
        }
    }, [data, date, petName, dominantColor]);

    const handleShare = useCallback(async () => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            const blob = await generateStoryImage();
            if (!blob) {
                toast.error("Failed to generate image");
                setIsSharing(false);
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Data = reader.result as string;
                const fileName = `pawmood_story_${Date.now()}.png`;

                try {
                    // Save to cache for sharing
                    const savedFile = await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Cache,
                    });

                    await Share.share({
                        title: `${petName}'s Mood Analysis`,
                        text: `Check out ${petName}'s mood analysis on PawMood!`,
                        url: savedFile.uri,
                    });
                    toast.success("Shared successfully!");
                } catch (err) {
                    console.error("Capacitor share error:", err);
                    // Fallback to web share if native fails
                    if (navigator.share) {
                        const file = new File([blob], `${petName}-story.png`, { type: "image/png" });
                        await navigator.share({
                            files: [file],
                            title: `${petName}'s Mood Analysis`,
                        });
                    }
                }
            };
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                console.error("Share error:", error);
                toast.error("Failed to share");
            }
        } finally {
            setIsSharing(false);
        }
    }, [isSharing, generateStoryImage, petName]);

    const handleInstagramShare = useCallback(async () => {
        if (isSharing) return;
        setIsSharing(true);
        toast.info("Preparing Instagram Story...");

        try {
            const blob = await generateStoryImage();
            if (!blob) throw new Error("Failed to generate image");

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Data = reader.result as string;
                const fileName = `instagram_story_${Date.now()}.png`;

                try {
                    const savedFile = await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Cache,
                    });

                    // Sharing a file URI usually promotes Instagram Stories in the share sheet
                    await Share.share({
                        title: "Share to Instagram Story",
                        url: savedFile.uri,
                    });
                } catch (err) {
                    console.error("Instagram share error:", err);
                    toast.error("Failed to open share menu");
                }
            };
        } catch (error) {
            console.error("Instagram share error:", error);
            toast.error("Failed to prepare story");
        } finally {
            setIsSharing(false);
        }
    }, [isSharing, generateStoryImage]);

    const handleDownload = useCallback(async () => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            const blob = await generateStoryImage();
            if (!blob) {
                toast.error("Failed to generate image");
                setIsSharing(false);
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Data = reader.result as string;
                const fileName = `pawmood_${Date.now()}.png`;

                try {
                    // On mobile, saving to "Documents" or "External" is better for user access
                    await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Documents,
                    });
                    toast.success("Image saved to Documents!");
                } catch (err) {
                    // Fallback to browser download for web/pwa
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${petName}-mood-story.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success("Image downloaded!");
                }
            };
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download");
        } finally {
            setIsSharing(false);
        }
    }, [isSharing, generateStoryImage, petName]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-[200] flex flex-col",
                isClosing ? "animate-fade-out" : "animate-fade-in"
            )}
            style={{
                background: `linear-gradient(180deg, ${dominantColor} 0%, ${adjustColorLightness(dominantColor, -8)} 100%)`,
            }}
            data-modal-container="true"
        >
            <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-2">
                <button
                    onClick={handleClose}
                    className={cn(
                        "w-10 h-10 rounded-full",
                        "flex items-center justify-center",
                        "bg-white/15 hover:bg-white/25",
                        "backdrop-blur-sm",
                        "transition-colors duration-200",
                        "active:scale-95"
                    )}
                    aria-label="Close"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                <span className="text-sm font-medium text-white/80">Story Preview</span>

                <div className="w-10" />
            </div>

            <div className="flex-1 flex items-center justify-center px-6 py-4 overflow-hidden">
                <div
                    className={cn(
                        "relative w-full max-w-[280px]",
                        "bg-white rounded-3xl",
                        "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]",
                        "overflow-hidden",
                        isClosing ? "animate-scale-out" : "animate-scale-in"
                    )}
                >
                    <div className="p-5">
                        {data.imageUrl && (
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <div
                                        className={cn(
                                            "w-20 h-20 rounded-full overflow-hidden",
                                            "ring-4 ring-primary/20",
                                            "shadow-lg"
                                        )}
                                    >
                                        <img
                                            src={data.imageUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            draggable={false}
                                        />
                                    </div>
                                    <div
                                        className="absolute inset-0 rounded-full scale-150 -z-10 blur-xl opacity-40"
                                        style={{
                                            background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground text-center mb-3">{date}</p>
                        <p className="text-4xl text-center mb-2">{data.moodEmoji}</p>
                        <p className="text-xl font-bold text-foreground text-center mb-1">{data.mood}</p>
                        <p className="text-sm font-semibold text-primary text-center mb-3">
                            {data.confidence}% confidence
                        </p>
                        <p className="text-xs text-muted-foreground text-center leading-relaxed line-clamp-2 mb-3">
                            {data.moodDescription}
                        </p>
                        <div className="border-t border-foreground/5 pt-3">
                            <p className="text-[10px] text-muted-foreground text-center">
                                {petName}'s Mood Analysis
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 px-6 pb-8 pt-4">
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleInstagramShare}
                        disabled={isSharing}
                        className={cn(
                            "w-full py-4 px-6 rounded-2xl",
                            "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045]",
                            "text-white font-bold text-base",
                            "flex items-center justify-center gap-3",
                            "shadow-[0_8px_20px_-6px_rgba(225,48,108,0.5)]",
                            "hover:opacity-90 active:scale-[0.98]",
                            "disabled:opacity-60 disabled:cursor-not-allowed",
                            "transition-all duration-200"
                        )}
                    >
                        <Instagram className="w-5 h-5" />
                        Instagram Story
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={isSharing}
                            className={cn(
                                "flex-1 py-3.5 px-4 rounded-2xl",
                                "bg-white/15 backdrop-blur-sm",
                                "text-white font-semibold text-sm",
                                "flex items-center justify-center gap-2",
                                "hover:bg-white/25 active:scale-[0.98]",
                                "disabled:opacity-60 disabled:cursor-not-allowed",
                                "transition-all duration-200"
                            )}
                        >
                            <Download className="w-4 h-4" />
                            Save
                        </button>

                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className={cn(
                                "flex-[2] py-3.5 px-6 rounded-2xl",
                                "bg-white text-foreground",
                                "font-semibold text-sm",
                                "flex items-center justify-center gap-2",
                                "shadow-lg",
                                "hover:bg-white/95 active:scale-[0.98]",
                                "disabled:opacity-60 disabled:cursor-not-allowed",
                                "transition-all duration-200"
                            )}
                        >
                            <Share2 className="w-4 h-4" />
                            {isSharing ? "Preparing..." : "Other Options"}
                        </button>
                    </div>
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>,
        document.body
    );
}

function adjustColorLightness(hslString: string, delta: number): string {
    const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return hslString;

    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = Math.max(0, Math.min(100, parseInt(match[3]) + delta));

    return `hsl(${h}, ${s}%, ${l}%)`;
}
