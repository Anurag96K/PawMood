import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface HomeMainViewProps {
    onStartCamera: () => void;
    onUploadFromGallery: () => void;
    hasCredits: boolean;
}

/**
 * HomeMainView - Displayed when user has credits and can take photos
 * Scoped styles specific to the Home/Camera screen unlocked state
 */
export function HomeMainView({
    onStartCamera,
    onUploadFromGallery,
    hasCredits
}: HomeMainViewProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 pt-4">
            <div className="relative w-full">
                {/* Card - active when has credits */}

            </div>

            {/* Main Actions - Matching the requested design */}
            <div className="mt-4 flex flex-col gap-3 w-full max-w-[400px]">
                <Button
                    onClick={(e) => {
                        const target = e.currentTarget;
                        onStartCamera();
                        setTimeout(() => target.blur(), 700);
                    }}
                    onPointerUp={(e) => {
                        const target = e.currentTarget;
                        setTimeout(() => target.blur(), 700);
                    }}
                    size="lg"
                    className="w-full shadow-warm-glow active:shadow-warm-glow active:brightness-110 transition-all duration-200 focus:ring-0 focus-visible:ring-0 focus:outline-none"
                >
                    <Camera className="w-5 h-5" />
                    Take Photo
                </Button>

                <Button
                    onClick={(e) => {
                        const target = e.currentTarget;
                        onUploadFromGallery();
                        setTimeout(() => target.blur(), 700);
                    }}
                    onPointerDown={(e) => {
                        const target = e.currentTarget;
                        setTimeout(() => target.blur(), 700);
                    }}
                    onPointerUp={(e) => {
                        const target = e.currentTarget;
                        setTimeout(() => target.blur(), 700);
                    }}
                    onPointerLeave={(e) => {
                        const target = e.currentTarget;
                        setTimeout(() => target.blur(), 700);
                    }}
                    variant="secondary"
                    size="lg"
                    className="w-full active:scale-95 transition-all duration-200 focus:ring-0 focus-visible:ring-0 focus:outline-none"
                >
                    <ImagePlus className="w-5 h-5" />
                    Select From Gallery
                </Button>
            </div>
        </div>
    );
}
