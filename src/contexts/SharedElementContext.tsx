import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

interface PhotoFrame {
    x: number;
    y: number;
    width: number;
    height: number;
    imageUrl: string;
}

interface SharedElementContextType {
    photoFrame: PhotoFrame | null;
    setPhotoFrame: (frame: PhotoFrame | null) => void;
    // Ref-based exit target that can be updated synchronously for animations
    exitTargetRef: React.MutableRefObject<PhotoFrame | null>;
    isTransitioning: boolean;
    setIsTransitioning: (value: boolean) => void;
    capturePhotoFrame: (element: HTMLElement | null, imageUrl: string) => PhotoFrame | null;
}

const SharedElementContext = createContext<SharedElementContextType | null>(null);

export function SharedElementProvider({ children }: { children: ReactNode }) {
    const [photoFrame, setPhotoFrame] = useState<PhotoFrame | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    // Ref for exit target - can be updated synchronously without waiting for re-render
    const exitTargetRef = useRef<PhotoFrame | null>(null);

    const capturePhotoFrame = useCallback((element: HTMLElement | null, imageUrl: string): PhotoFrame | null => {
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        const frame: PhotoFrame = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            imageUrl,
        };
        setPhotoFrame(frame);
        // Also set as initial exit target
        exitTargetRef.current = frame;
        return frame;
    }, []);

    return (
        <SharedElementContext.Provider
            value={{
                photoFrame,
                setPhotoFrame,
                exitTargetRef,
                isTransitioning,
                setIsTransitioning,
                capturePhotoFrame,
            }}
        >
            {children}
        </SharedElementContext.Provider>
    );
}

export function useSharedElement() {
    const context = useContext(SharedElementContext);
    if (!context) {
        throw new Error("useSharedElement must be used within a SharedElementProvider");
    }
    return context;
}
