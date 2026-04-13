
import { Button } from "@/components/ui/button";

interface LandingScreenProps {
    onGetStarted: () => void;
    onSignIn: () => void;
}

export function LandingScreen({ onGetStarted, onSignIn }: LandingScreenProps) {
    return (
        <div className="h-screen bg-background flex flex-col items-center justify-between px-6 py-10">
            {/* Hero / Visual Area */}
            <div className="flex-1 flex items-center justify-center w-full">
                <div className="text-center space-y-4">
                    {/* Abstract Visual Anchor */}
                    <div className="w-64 h-64 bg-secondary/30 rounded-full blur-3xl absolute top-1/4 left-1/2 -translate-x-1/2 -z-10" />
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full space-y-8 mb-8">
                <h1 className="text-4xl font-extrabold text-center leading-tight tracking-tight">
                    Understand your <br />
                    Pawmood
                </h1>

                <div className="space-y-4">
                    <Button
                        className="w-full h-14 text-lg font-bold rounded-full"
                        size="lg"
                        onClick={onGetStarted}
                    >
                        Get Started
                    </Button>

                    <div className="text-center">
                        <button
                            onClick={onSignIn}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Already have an account? <span className="font-bold text-foreground">Sign In</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
