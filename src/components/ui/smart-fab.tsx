"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, ExternalLink, Loader2 } from "lucide-react";
import { useFab } from "@/providers/ActionProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SmartFAB() {
  const { actions } = useFab();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  // Fixed actions
  const fixedActions = [
    {
      label: "Ver mi carta",
      icon: ExternalLink,
      onClick: () => {
        // Logic to open the menu in a new tab
        // Ideally this URL should come from a config or context, but for now we'll use a placeholder or just the root
        window.open("/", "_blank");
      },
      variant: "secondary" as const,
    },
  ];

  const allActions = [...actions, ...fixedActions];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {allActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="bg-background/90 backdrop-blur px-3 py-1.5 rounded-md text-sm font-medium shadow-sm border hidden md:block">
                  {action.label}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={action.variant || "default"}
                        className="h-12 w-12 rounded-full shadow-lg"
                        onClick={() => {
                          action.onClick();
                          // Optional: close on click
                          // setIsOpen(false);
                        }}
                        disabled={
                          "disabled" in action &&
                          (action.disabled || action.loading)
                        }
                      >
                        {"loading" in action && action.loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <action.icon className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="md:hidden">
                      <p>{action.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className={`h-14 w-14 rounded-full shadow-xl transition-transform duration-300 ${
          isOpen ? "rotate-45" : "rotate-0"
        }`}
        onClick={toggleOpen}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
