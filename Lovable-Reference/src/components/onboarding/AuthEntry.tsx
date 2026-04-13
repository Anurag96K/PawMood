import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthEntryProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function AuthEntry({ onGetStarted, onSignIn }: AuthEntryProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-warm-glow mb-6 animate-bounce-gentle">
          <PawPrint className="w-14 h-14 text-primary-foreground" />
        </div>
        
        <h1 className="text-3xl font-bold text-emphasis mb-2">
          Welcome to PetMood
        </h1>
        <p className="text-muted-foreground text-center max-w-xs leading-relaxed">
          Discover your pet's emotions and create beautiful memories together
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-8 pb-12 space-y-3">
        <Button 
          className="w-full h-14 text-base font-semibold"
          onClick={onGetStarted}
        >
          Get Started
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-14 text-base font-semibold"
          onClick={onSignIn}
        >
          Sign In
        </Button>
        
        <p className="text-xs text-muted-foreground text-center pt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
