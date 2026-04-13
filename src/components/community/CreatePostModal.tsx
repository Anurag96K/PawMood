import { useState, useRef, useEffect } from "react";
import { X, Camera, ImageOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (image: string, caption: string) => void;
}

export function CreatePostModal({ onClose, onSubmit }: CreatePostModalProps) {
  const { t } = useLanguage();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Lock body scroll when modal is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.log("Camera access denied - using mock mode");
      setCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
        validateImage(imageData);
      }
    } else {
      const mockImageUrl = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop";
      setCapturedImage(mockImageUrl);
      stopCamera();
      validateImage(mockImageUrl);
    }
  };

  const validateImage = async (imageUrl: string) => {
    setIsValidating(true);
    setValidationError(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const isPetPhoto = Math.random() > 0.2;

    setIsValidating(false);

    if (!isPetPhoto) {
      setValidationError(t("petOnlyError"));
      setCapturedImage(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setValidationError(null);
    startCamera();
  };

  const handleSubmit = () => {
    if (capturedImage && !validationError) {
      onSubmit(capturedImage, caption);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up app-container">
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{t("createPost")}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!cameraActive && !capturedImage ? (
            <div className="aspect-square rounded-xl bg-muted flex flex-col items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground text-xs text-center mb-3 px-4">
                {t("takePhotoForPost")}
              </p>
              <Button onClick={startCamera} size="sm" className="text-xs h-8">
                <Camera className="w-4 h-4" />
                {t("openCamera")}
              </Button>
            </div>
          ) : cameraActive && !capturedImage ? (
            <div className="mb-3">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-foreground/10 mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-background/60 rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-background/60 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-background/60 rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-background/60 rounded-br-lg" />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-14 h-14 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-primary" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                )}

                {isValidating && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-xs font-medium text-foreground">{t("validatingImage")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("checkingPet")}</p>
                  </div>
                )}

                {validationError && (
                  <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                      <ImageOff className="w-6 h-6 text-destructive" />
                    </div>
                    <p className="text-xs font-medium text-foreground text-center mb-2">{validationError}</p>
                    <Button variant="outline" onClick={handleRetake} size="sm" className="text-xs h-8">
                      {t("tryAgain")}
                    </Button>
                  </div>
                )}
              </div>

              {!isValidating && !validationError && capturedImage && (
                <>
                  <div className="mb-3">
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder={t("captionPlaceholder")}
                      className="w-full h-20 p-2 bg-muted rounded-lg text-foreground text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      maxLength={280}
                    />
                    <p className="text-[10px] text-muted-foreground text-right">
                      {caption.length}/280
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRetake} className="flex-1 h-9 text-xs">
                      {t("retake")}
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1 h-9 text-xs">
                      {t("post")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pet-only notice */}
          <div className="flex items-start gap-2 p-2 bg-accent/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              {t("petOnlyNotice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}