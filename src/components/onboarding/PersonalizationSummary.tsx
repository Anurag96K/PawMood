import { Dog, Cat, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PetData } from "./PetSetup";
import { format } from "date-fns";

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

const petIcons = {
  dog: Dog,
  cat: Cat,
  other: HelpCircle,
};

export function PersonalizationSummary({ petData, onConfirm, onEdit }: PersonalizationSummaryProps) {
  const Icon = petData.type ? petIcons[petData.type] : HelpCircle;
  const purposeText = petData.purposes
    .map((p) => purposeLabels[p] || p)
    .join(", ");

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="pt-8 px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-warm-glow animate-bounce-gentle">
          <Icon className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-emphasis">
          Let's confirm! 🎉
        </h1>
      </div>

      {/* Summary Card */}
      <div className="flex-1 px-6 py-8">
        <div className="bg-card rounded-3xl p-6 shadow-card space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Pet Name</p>
            <p className="text-xl font-bold text-emphasis">{petData.name}</p>
          </div>

          <div className="h-px bg-border" />

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">Type</p>
              <p className="font-semibold text-foreground capitalize">
                {petData.type === "dog" ? "🐕 Dog" : petData.type === "cat" ? "🐈 Cat" : "🐾 Other"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">Gender</p>
              <p className="font-semibold text-foreground capitalize">
                {petData.gender === "male" ? "♂️ Male" : "♀️ Female"}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Birthday</p>
            <p className="font-semibold text-foreground">
              {petData.birthday ? format(petData.birthday, "MMMM d, yyyy") : "Not set"}
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">Here for</p>
            <p className="font-semibold text-foreground text-sm leading-relaxed">
              {purposeText || "Not specified"}
            </p>
          </div>
        </div>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Does this look right? 😊
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8 space-y-3">
        <Button className="w-full h-14 text-base font-semibold" onClick={onConfirm}>
          Save my info
        </Button>
        <Button variant="ghost" className="w-full" onClick={onEdit}>
          Edit details
        </Button>
      </div>
    </div>
  );
}
