import { useState, useCallback } from "react";
import { X, Share2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SharePreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  /** Pre-captured screenshot data URL of the report scene */
  capturedImage: string | null;
  /** Dominant mood string for styling the export background */
  dominantMood?: string;
}

/** Returns mood-themed gradient colors for the Spotify-style export background */
function getMoodExportColors(mood: string): { c1: string; c2: string; c3: string } {
  const m = mood.toLowerCase();
  if (m.includes("happy") || m.includes("joyful"))
    return { c1: "#FFF4E6", c2: "#FFF0DC", c3: "#FFE0B2" };
  if (m.includes("playful"))
    return { c1: "#FFFDE7", c2: "#FFFCDA", c3: "#FFF59D" };
  if (m.includes("calm") || m.includes("peaceful"))
    return { c1: "#EBF5FB", c2: "#E3F0F9", c3: "#CDDFF0" };
  if (m.includes("excited") || m.includes("energetic"))
    return { c1: "#FFF8E1", c2: "#FFECB3", c3: "#FFE082" };
  if (m.includes("relaxed") || m.includes("content"))
    return { c1: "#FFF8F0", c2: "#FFF0E0", c3: "#FFE4CC" };
  if (m.includes("curious") || m.includes("alert"))
    return { c1: "#E8F5E9", c2: "#DCEDC8", c3: "#C5E1A5" };
  if (m.includes("tired") || m.includes("sleepy"))
    return { c1: "#F3E5F5", c2: "#EEE0F0", c3: "#E1CEE4" };
  if (m.includes("anxious") || m.includes("worried"))
    return { c1: "#E8EAF6", c2: "#E0E3F0", c3: "#C5CAE9" };
  return { c1: "#FFF7ED", c2: "#FFFBF5", c3: "#FFEDD5" };
}

/**
 * Generate a Spotify-style 1080×1920 story image:
 * - Mood-themed gradient background
 * - Captured screenshot rendered as a centered, smaller card with rounded corners and shadow
 */
async function generateStoryImage(
  capturedImage: string,
  dominantMood: string
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = 1080;
  canvas.height = 1920;

  // Draw mood-themed background gradient
  const colors = getMoodExportColors(dominantMood);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, colors.c1);
  gradient.addColorStop(0.5, colors.c2);
  gradient.addColorStop(1, colors.c3);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load the captured screenshot
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load captured image"));
    img.src = capturedImage;
  });

  // Calculate card dimensions — centered, ~75% width, maintain aspect ratio
  const cardWidth = canvas.width * 0.75; // ~810px
  const cardAspect = img.height / img.width;
  const cardHeight = cardWidth * cardAspect;
  const cardX = (canvas.width - cardWidth) / 2;
  const cardY = (canvas.height - cardHeight) / 2;
  const cardRadius = 40;

  // Draw card shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
  ctx.fill();
  ctx.restore();

  // Clip to rounded rect and draw the screenshot
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
  ctx.clip();
  ctx.drawImage(img, cardX, cardY, cardWidth, cardHeight);
  ctx.restore();

  // Subtle border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.06)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
  ctx.stroke();

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png", 1.0);
  });
}

export function SharePreviewSheet({
  isOpen,
  onClose,
  petName,
  capturedImage,
  dominantMood = "",
}: SharePreviewSheetProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (isSharing || !capturedImage) return;
    setIsSharing(true);

    try {
      const blob = await generateStoryImage(capturedImage, dominantMood);
      if (!blob) {
        toast.error("Failed to generate story image");
        setIsSharing(false);
        return;
      }

      const file = new File([blob], `${petName}-mood-report.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${petName}'s Mood Report`,
        });
        toast.success("Shared successfully!");
      } else if (navigator.share) {
        await navigator.share({
          title: `${petName}'s Mood Report`,
        });
        toast.success("Shared successfully!");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${petName}-mood-report.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Image downloaded!");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share error:", error);
        toast.error("Failed to share");
      }
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, capturedImage, petName, dominantMood]);

  const handleDownload = useCallback(async () => {
    if (isSharing || !capturedImage) return;
    setIsSharing(true);

    try {
      const blob = await generateStoryImage(capturedImage, dominantMood);
      if (!blob) {
        toast.error("Failed to generate image");
        setIsSharing(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${petName}-mood-report.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image saved!");
    } catch {
      toast.error("Failed to save image");
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, capturedImage, petName, dominantMood]);

  if (!isOpen || !capturedImage) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-t-3xl overflow-hidden",
          "animate-[slide-up_0.4s_ease-out_forwards]",
          "bg-card",
          "pb-safe"
        )}
        style={{ maxHeight: "90vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-foreground/15" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "bg-foreground/8 hover:bg-foreground/12",
            "transition-colors duration-200"
          )}
          aria-label="Close preview"
        >
          <X className="w-4 h-4 text-foreground/60" />
        </button>

        {/* Content */}
        <div className="px-6 pt-3 pb-8">
          <h3 className="text-[15px] font-semibold text-foreground/60 text-center mb-5">
            Share Preview
          </h3>

          {/* Full-bleed story preview — edge-to-edge screenshot, no card */}
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden"
              style={{
                width: "100%",
                maxWidth: "280px",
                aspectRatio: "9 / 16",
              }}
            >
              <img
                src={capturedImage}
                alt="Story preview"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            {/* Save */}
            <button
              onClick={handleDownload}
              disabled={isSharing}
              className={cn(
                "flex-1 py-3.5 px-4 rounded-2xl",
                "bg-foreground/6",
                "text-foreground/65 font-semibold text-sm",
                "flex items-center justify-center gap-2",
                "hover:bg-foreground/10 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
            >
              <Download className="w-4.5 h-4.5" />
              Save
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={cn(
                "flex-[2] py-3.5 px-6 rounded-2xl",
                "bg-primary text-primary-foreground",
                "font-semibold text-sm",
                "flex items-center justify-center gap-2",
                "shadow-warm-lg",
                "hover:opacity-95 active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
            >
              <Share2 className="w-4.5 h-4.5" />
              {isSharing ? "Preparing..." : "Share"}
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slide-up {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
