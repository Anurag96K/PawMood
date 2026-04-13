import { useState, useRef } from "react";
import { ArrowLeft, Camera, Upload, X, Loader2, ImageOff, AlertCircle, MapPin, Hash, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreatePostPageProps {
  onClose: () => void;
  onSubmit: (image: string, caption: string, hashtags: string, location: string, scheduledTime: string) => void;
}

export function CreatePostPage({ onClose, onSubmit }: CreatePostPageProps) {
  const { t } = useLanguage();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [location, setLocation] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [step, setStep] = useState<"capture" | "details">("capture");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setCapturedImage(imageData);
        validateImage(imageData);
      };
      reader.readAsDataURL(file);
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
    } else {
      setStep("details");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setValidationError(null);
    setStep("capture");
  };

  const handleSubmit = () => {
    if (capturedImage && !validationError) {
      onSubmit(capturedImage, caption, hashtags, location, scheduledTime);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 pt-8 border-b border-border">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-sm font-semibold text-foreground flex-1">{t("createPost")}</h1>
        {step === "details" && (
          <Button onClick={handleSubmit} disabled={!capturedImage} size="sm" className="text-xs h-8">
            {t("post")}
          </Button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {step === "capture" && !cameraActive && !capturedImage ? (
          <div className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-full aspect-square rounded-2xl bg-muted flex flex-col items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-3">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <p className="text-muted-foreground text-xs text-center px-4 mb-4">
                {t("takePhotoForPost")}
              </p>
            </div>
            
            <div className="w-full space-y-2">
              <Button onClick={startCamera} className="w-full h-10 text-sm">
                <Camera className="w-4 h-4" />
                {t("openCamera")}
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                className="w-full h-10 text-sm"
              >
                <Upload className="w-4 h-4" />
                Upload from Gallery
              </Button>
            </div>
          </div>
        ) : cameraActive && !capturedImage ? (
          <div className="p-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-foreground/10 mb-4">
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
            
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => { stopCamera(); setCameraActive(false); }} className="text-xs h-8">
                Cancel
              </Button>
              <button
                onClick={capturePhoto}
                className="w-14 h-14 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-primary" />
              </button>
              <Button variant="outline" size="sm" onClick={() => { stopCamera(); fileInputRef.current?.click(); }} className="text-xs h-8">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : step === "capture" && capturedImage ? (
          <div className="p-4">
            <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              
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
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
              <img src={capturedImage!} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={handleRetake}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t("captionPlaceholder")}
                className="w-full h-20 p-2 bg-muted rounded-lg text-foreground text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={280}
              />
              <p className="text-[10px] text-muted-foreground text-right">{caption.length}/280</p>
            </div>

            {/* Hashtags */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#dog #puppy #cute"
                className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Schedule */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Schedule (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Pet notice */}
            <div className="flex items-start gap-2 p-2 bg-accent/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                {t("petOnlyNotice")}
              </p>
            </div>

            {/* Submit button */}
            <Button onClick={handleSubmit} className="w-full h-10 text-sm">
              {scheduledTime ? "Schedule Post" : t("post")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}