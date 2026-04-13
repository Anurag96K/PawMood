import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[20px] text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_5px_14px_-4px_hsl(var(--primary)/0.4),0_2px_6px_-2px_hsl(var(--primary)/0.25)] hover:shadow-[0_7px_18px_-4px_hsl(var(--primary)/0.45),0_3px_8px_-2px_hsl(var(--primary)/0.3)] hover:brightness-105",
        destructive: "bg-destructive text-destructive-foreground shadow-[0_5px_14px_-4px_hsl(var(--destructive)/0.4),0_2px_6px_-2px_hsl(var(--destructive)/0.25)] hover:shadow-[0_7px_18px_-4px_hsl(var(--destructive)/0.45)] hover:brightness-105",
        outline: "border-2 border-input bg-card hover:bg-accent hover:text-accent-foreground shadow-[0_3px_10px_-4px_hsl(var(--foreground)/0.12),0_1px_3px_-2px_hsl(var(--foreground)/0.08)]",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_3px_10px_-4px_hsl(var(--foreground)/0.1),0_1px_3px_-2px_hsl(var(--foreground)/0.06)] hover:shadow-[0_5px_14px_-4px_hsl(var(--foreground)/0.14)] hover:brightness-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[52px] px-6 py-3",
        sm: "min-h-[40px] rounded-[16px] px-5 py-2",
        lg: "min-h-[56px] rounded-[22px] px-10 py-4",
        icon: "min-h-[46px] w-[46px] rounded-[16px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
