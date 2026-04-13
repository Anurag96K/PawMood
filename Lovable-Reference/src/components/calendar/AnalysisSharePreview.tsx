import { useEffect, useState, useRef, useCallback, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Copy, MoreHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AnalysisCardData } from "./AnalysisCard";
import { StoryShareScreen } from "./StoryShareScreen";

// Share target configuration
const SHARE_TARGETS = [
  {
    id: "copy",
    label: "Copy",
    icon: Copy,
    color: "bg-muted",
    textColor: "text-foreground",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: null,
    emoji: "📸",
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    textColor: "text-white",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: null,
    emoji: "💬",
    color: "bg-emerald-500",
    textColor: "text-white",
  },
  {
    id: "messages",
    label: "Messages",
    icon: null,
    emoji: "💬",
    color: "bg-green-400",
    textColor: "text-white",
  },
  {
    id: "more",
    label: "More",
    icon: MoreHorizontal,
    color: "bg-muted",
    textColor: "text-foreground",
  },
];

interface AnalysisSharePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalysisCardData;
  date: string;
  petName?: string;
}

export function AnalysisSharePreview({
  isOpen,
  onClose,
  data,
  date,
  petName = "My Pet",
}: AnalysisSharePreviewProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [showStoryScreen, setShowStoryScreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // TRUE modal barrier: disable interactions on the underlying React app root while open.
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    if (!isOpen) return;

    const prevPointerEvents = root.style.pointerEvents;
    root.style.pointerEvents = "none";

    return () => {
      root.style.pointerEvents = prevPointerEvents;
    };
  }, [isOpen]);

  // Pre-generate the share image when modal opens
  useEffect(() => {
    if (!isOpen) {
      setGeneratedBlob(null);
      return;
    }
    
    generateShareImage().then(setGeneratedBlob);
  }, [isOpen, data, date, petName]);

  const generateShareImage = useCallback(async (): Promise<Blob | null> => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set canvas size (Instagram story aspect ratio 9:16)
      canvas.width = 1080;
      canvas.height = 1920;

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#FFF7ED');
      gradient.addColorStop(0.5, '#FFFBF5');
      gradient.addColorStop(1, '#FFEDD5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Card dimensions and position
      const cardWidth = 900;
      const cardHeight = 1100;
      const cardX = (canvas.width - cardWidth) / 2;
      const cardY = (canvas.height - cardHeight) / 2;
      const cardRadius = 60;

      // Draw card shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;
      
      // Draw card background
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
      ctx.fill();
      ctx.restore();

      // Draw subtle card border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
      ctx.stroke();

      // Load and draw pet image
      if (data.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = data.imageUrl;
        });

        const imgSize = 320;
        const imgX = canvas.width / 2;
        const imgY = cardY + 220;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX, imgY, imgSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, imgX - imgSize / 2, imgY - imgSize / 2, imgSize, imgSize);
        ctx.restore();

        ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(imgX, imgY, imgSize / 2 + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw date
      ctx.fillStyle = '#6B7280';
      ctx.font = '36px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(date, canvas.width / 2, cardY + 420);

      // Draw mood emoji
      ctx.font = '100px system-ui';
      ctx.fillText(data.moodEmoji, canvas.width / 2, cardY + 560);

      // Draw mood text
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
      ctx.fillText(data.mood, canvas.width / 2, cardY + 680);

      // Draw confidence
      ctx.fillStyle = '#F97316';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${data.confidence}% confidence`, canvas.width / 2, cardY + 760);

      // Draw description
      ctx.fillStyle = '#6B7280';
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      const maxWidth = cardWidth - 100;
      const description = data.moodDescription.length > 80 
        ? data.moodDescription.substring(0, 77) + '...'
        : data.moodDescription;
      
      const words = description.split(' ');
      let line = '';
      let lineY = cardY + 840;
      const lineHeight = 44;
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), canvas.width / 2, lineY);
          line = word + ' ';
          lineY += lineHeight;
          if (lineY > cardY + 960) break;
        } else {
          line = testLine;
        }
      }
      if (line && lineY <= cardY + 960) {
        ctx.fillText(line.trim(), canvas.width / 2, lineY);
      }

      // Draw pet name footer
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${petName}'s Mood Analysis`, canvas.width / 2, cardY + cardHeight - 60);

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      return blob;
    } catch (error) {
      console.error('Error generating share image:', error);
      return null;
    }
  }, [data, date, petName]);

  const shareText = `${petName} is feeling ${data.mood}! ${data.moodEmoji} (${data.confidence}% confidence)`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [shareText]);

  const handleShareTarget = useCallback(async (targetId: string) => {
    if (isSharing) return;

    if (targetId === "copy") {
      await handleCopyLink();
      return;
    }

    setIsSharing(true);

    try {
      const blob = generatedBlob || await generateShareImage();
      
      if (!blob) {
        toast.error("Failed to generate share image");
        setIsSharing(false);
        return;
      }

      const file = new File([blob], `${petName}-mood-analysis.png`, { type: 'image/png' });
      const encodedText = encodeURIComponent(shareText);

      // Handle different share targets
      switch (targetId) {
        case "instagram": {
          // Instagram deep link (works on mobile with Instagram installed)
          // For web, fall back to native share
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${petName}'s Mood Analysis`,
              text: shareText,
            });
            toast.success("Shared successfully!");
          } else {
            toast.info("Open Instagram and share from your gallery");
            // Download the image so user can share manually
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${petName}-mood-analysis.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          break;
        }
        case "whatsapp": {
          // WhatsApp web/app share
          const whatsappUrl = `https://wa.me/?text=${encodedText}`;
          window.open(whatsappUrl, '_blank');
          // Also try to share the image via native share
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            setTimeout(async () => {
              try {
                await navigator.share({ files: [file] });
              } catch { /* User may cancel, that's ok */ }
            }, 500);
          }
          break;
        }
        case "messages": {
          // SMS/iMessage
          const smsUrl = `sms:?body=${encodedText}`;
          window.location.href = smsUrl;
          break;
        }
        case "more":
        default: {
          // Native share sheet
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${petName}'s Mood Analysis`,
              text: shareText,
            });
            toast.success("Shared successfully!");
          } else if (navigator.share) {
            await navigator.share({
              title: `${petName}'s Mood Analysis`,
              text: shareText,
            });
            toast.success("Shared successfully!");
          } else {
            // Fallback: Download the image
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${petName}-mood-analysis.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Image downloaded!");
          }
          break;
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error("Failed to share");
      }
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, generatedBlob, generateShareImage, petName, shareText, handleCopyLink]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 340);
  }, [isClosing, onClose]);

  // Block all events from propagating to parent
  const blockAllEvents = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={blockAllEvents}
      onPointerDown={blockAllEvents}
      onPointerUp={blockAllEvents}
      onTouchStart={blockAllEvents}
      onTouchEnd={blockAllEvents}
      onTouchMove={blockAllEvents}
      onMouseDown={blockAllEvents}
      onMouseUp={blockAllEvents}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm",
          isClosing ? "animate-fade-out" : "animate-fade-in"
        )}
      />
      
      {/* Sheet - compact, native share-sheet style */}
      <div 
        className={cn(
          "relative w-full max-w-lg bg-background rounded-t-3xl",
          "pb-safe",
          isClosing 
            ? "animate-[slide-down_0.34s_ease-in_forwards]" 
            : "animate-[slide-up_0.4s_ease-out_forwards]"
        )}
        style={{ maxHeight: "90vh" }}
        onClick={blockAllEvents}
        onPointerDown={blockAllEvents}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className={cn(
            "absolute top-4 right-4 w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "bg-muted/80 hover:bg-muted",
            "transition-colors duration-200",
            "active:scale-95"
          )}
          aria-label="Close preview"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>

        {/* Content */}
        <div className="px-5 pt-3 pb-6">
          <h3 className="text-base font-semibold text-foreground text-center mb-4">
            Share Preview
          </h3>

          {/* Preview Card - compact */}
          <div 
            ref={cardRef}
            className={cn(
              "relative mx-auto p-4 rounded-[20px]",
              "bg-white",
              "shadow-[0_6px_24px_-4px_hsl(var(--foreground)/0.1),0_12px_32px_-8px_hsl(var(--primary)/0.06)]"
            )}
            style={{ maxWidth: "280px" }}
          >
            {/* Background gradient */}
            <div 
              className="absolute inset-0 rounded-[20px] overflow-hidden -z-10"
              style={{
                background: "linear-gradient(180deg, hsl(var(--primary)/0.03) 0%, transparent 50%)"
              }}
            />

            {/* Pet photo */}
            {data.imageUrl && (
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-3 ring-primary/15 shadow-md">
                    <img
                      src={data.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-primary/15 blur-lg -z-10 scale-125" />
                </div>
              </div>
            )}

            {/* Date */}
            <p className="text-[10px] text-muted-foreground text-center mb-2">
              {date}
            </p>

            {/* Mood emoji */}
            <p className="text-3xl text-center mb-1">
              {data.moodEmoji}
            </p>

            {/* Mood text */}
            <p className="text-lg font-bold text-foreground text-center mb-0.5">
              {data.mood}
            </p>

            {/* Confidence */}
            <p className="text-xs font-semibold text-primary text-center mb-2">
              {data.confidence}% confidence
            </p>

            {/* Description */}
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed line-clamp-1">
              {data.moodDescription}
            </p>

            {/* Pet name label */}
            <p className="text-[10px] text-muted-foreground text-center mt-2 pt-2 border-t border-foreground/5">
              {petName}'s Mood Analysis
            </p>
          </div>

          {/* Share Options Row - native style */}
          <div className="mt-5">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Share to
            </p>
            <div className="flex justify-center gap-4">
              {SHARE_TARGETS.map((target) => (
                <button
                  key={target.id}
                  onClick={() => handleShareTarget(target.id)}
                  disabled={isSharing}
                  className={cn(
                    "flex flex-col items-center gap-1.5",
                    "transition-all duration-150",
                    "active:scale-95",
                    "disabled:opacity-50"
                  )}
                >
                  <div 
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      "shadow-sm",
                      target.color,
                      target.id === "copy" && copiedLink && "bg-emerald-100"
                    )}
                  >
                    {target.id === "copy" ? (
                      copiedLink ? (
                        <Check className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Copy className={cn("w-6 h-6", target.textColor)} />
                      )
                    ) : target.icon ? (
                      <target.icon className={cn("w-6 h-6", target.textColor)} />
                    ) : (
                      <span className="text-2xl">{target.emoji}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {target.id === "copy" && copiedLink ? "Copied!" : target.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Share CTA - Opens Story Share Screen */}
          <button
            onClick={() => setShowStoryScreen(true)}
            disabled={isSharing}
            className={cn(
              "w-full mt-5 py-3.5 px-6 rounded-2xl",
              "bg-primary text-primary-foreground",
              "font-semibold text-sm",
              "flex items-center justify-center gap-2",
              "shadow-warm",
              "hover:opacity-95 active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            <Share2 className="w-4 h-4" />
            Share to Story
          </button>
        </div>
      </div>

      {/* Story Share Screen */}
      <StoryShareScreen
        isOpen={showStoryScreen}
        onClose={() => setShowStoryScreen(false)}
        data={data}
        date={date}
        petName={petName}
      />

      {/* Animation keyframes */}
      <style>{`
        @keyframes slide-up {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes slide-down {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>,
    document.body
  );
}
