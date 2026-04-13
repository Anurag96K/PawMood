import { Button } from "@/components/ui/button";
import { PetData } from "./PetSetup";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface PersonalizationSummaryProps {
  petData: PetData;
  onConfirm: () => void;
  onEdit: () => void;
}

const purposeLabels: Record<string, string> = {
  mood: "Pet mood analysis",
  memory: "Memory tracking",
  sharing: "Daily sharing",
  other: "Other",
};

const petTypeLabels: Record<string, string> = {
  dog: "Dog",
  cat: "Cat",
  other: "Other",
};

const genderLabels: Record<string, string> = {
  male: "Male",
  female: "Female",
};

export function PersonalizationSummary({ petData, onConfirm, onEdit }: PersonalizationSummaryProps) {
  const purposeText = petData.purposes
    .map((p) => purposeLabels[p] || p)
    .join(", ");

  const typeAndGender = [
    petTypeLabels[petData.type || ""] || petData.type,
    genderLabels[petData.gender || ""] || petData.gender,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Main content area - centered vertically with balanced spacing */}
      <div className="flex-1 flex flex-col justify-center px-6 py-6">
        {/* Header - strong title emphasis */}
        <div className="text-center mb-5 flex-shrink-0">
          {/* Circular check badge */}
          <motion.div 
            className="flex justify-center mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center border-[1.5px] border-primary bg-primary/10"
              style={{
                boxShadow: '0 0 10px 1px hsl(var(--primary) / 0.15)',
              }}
            >
              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
            </div>
          </motion.div>
          
          <h1 className="text-[28px] font-extrabold text-emphasis leading-tight">
            Let's confirm! 🎉
          </h1>
          <p className="text-foreground/70 text-xs mt-2 font-medium">
            Please double-check the details below.
          </p>
        </div>

        {/* Summary Card - intrinsic height, not stretched */}
        <div 
          className="rounded-[20px] p-4 flex-shrink-0"
          style={{
            backgroundColor: 'hsl(30 20% 98%)',
            boxShadow: '0 6px 28px -4px hsl(25 30% 35% / 0.18), 0 2px 8px -2px hsl(25 25% 30% / 0.1)',
          }}
        >
          {/* Pet Name */}
          <div className="flex items-start gap-3 py-3 border-b border-border/40">
            <span className="text-sm mt-0.5 opacity-70">🐾</span>
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground/60 text-[11px] font-medium mb-0.5">Pet name</p>
              <p className="text-[15px] font-bold text-emphasis">{petData.name}</p>
            </div>
          </div>

          {/* Type & Gender */}
          <div className="flex items-start gap-3 py-3 border-b border-border/40">
            <span className="text-sm mt-0.5 opacity-70">🐶</span>
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground/60 text-[11px] font-medium mb-0.5">Type & gender</p>
              <p className="text-[14px] font-semibold text-foreground">
                {typeAndGender || "Not specified"}
              </p>
            </div>
          </div>

          {/* Birthday */}
          <div className="flex items-start gap-3 py-3 border-b border-border/40">
            <span className="text-sm mt-0.5 opacity-70">🎂</span>
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground/60 text-[11px] font-medium mb-0.5">Birthday</p>
              <p className="text-[14px] font-semibold text-foreground">
                {petData.birthday ? format(petData.birthday, "MMMM d, yyyy") : "Not set"}
              </p>
            </div>
          </div>

          {/* Purpose */}
          <div className="flex items-start gap-3 py-3">
            <span className="text-sm mt-0.5 opacity-70">📝</span>
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground/60 text-[11px] font-medium mb-0.5">Purpose</p>
              <p className="text-[14px] font-semibold text-foreground leading-relaxed">
                {purposeText || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom actions - pinned to bottom */}
      <div className="flex-shrink-0 px-6 pt-3 pb-8 space-y-2 bg-background">
        <Button 
          className="w-full h-[52px] text-base font-semibold rounded-[20px]" 
          onClick={onConfirm}
        >
          Save my info
        </Button>
        <button
          type="button"
          onClick={onEdit}
          tabIndex={-1}
          className="w-full h-[48px] text-sm text-muted-foreground font-medium rounded-[20px] transition-all duration-150 ease-out select-none outline-none hover:bg-primary/10 hover:text-primary active:bg-primary/15 active:scale-[0.98]"
        >
          Edit details
        </button>
      </div>
    </div>
  );
}
