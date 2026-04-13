import React from "react";
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download, Share2, X, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    onShareInstagram: () => void;
    onSaveImage: () => void;
    onShareSystem: () => void;
    isSharing?: boolean;
}

export function ShareSheet({
    isOpen,
    onClose,
    imageUrl,
    onShareInstagram,
    onSaveImage,
    onShareSystem,
    isSharing = false
}: ShareSheetProps) {
    const { t } = useLanguage();

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="z-[60] bg-zinc-950 border-zinc-900">
                <div className="mx-auto w-full max-w-sm flex flex-col h-[85vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <h3 className="text-zinc-100 font-bold text-lg">{t("shareStory") || "Share Story"}</h3>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </DrawerClose>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 px-6 pb-6 min-h-0 flex items-center justify-center">
                        <div className="relative w-full h-full max-h-[550px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="Share Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-8 space-y-3">
                        <Button
                            onClick={onShareInstagram}
                            disabled={isSharing || !imageUrl}
                            className="w-full h-14 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-pink-900/20"
                        >
                            <Instagram className="w-6 h-6" />
                            <span>{t("instagramStories") || "Instagram Stories"}</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={onSaveImage}
                                disabled={isSharing || !imageUrl}
                                variant="outline"
                                className="h-12 rounded-xl border-zinc-800 bg-zinc-900/50 text-zinc-100 hover:bg-zinc-800 font-semibold"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {t("saveImage") || "Save Image"}
                            </Button>
                            <Button
                                onClick={onShareSystem}
                                disabled={isSharing || !imageUrl}
                                variant="outline"
                                className="h-12 rounded-xl border-zinc-800 bg-zinc-900/50 text-zinc-100 hover:bg-zinc-800 font-semibold"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                {t("moreOptions") || "More Options"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
