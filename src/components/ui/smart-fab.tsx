"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, ExternalLink, Loader2, Printer } from "lucide-react";
import { useFab } from "@/providers/ActionProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SmartFAB() {
  const { data: session } = useSession();
  const { actions } = useFab();
  const [isOpen, setIsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDownCapture = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;

      const targetNode = event.target as Node | null;
      if (targetNode && !root.contains(targetNode)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDownCapture, {
      capture: true,
    });

    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, {
        capture: true,
      } as AddEventListenerOptions);
    };
  }, [isOpen]);

  // Fixed actions
  const fixedActions = [
    {
      label: "Imprimir Carta",
      icon: Printer,
      onClick: () => setIsPrintModalOpen(true),
      variant: "secondary" as const,
    },
    {
      label: "Ver mi carta",
      icon: ExternalLink,
      onClick: () => {
        const slug = session?.user?.slug;
        if (slug) {
          const protocol = window.location.protocol;
          const host = window.location.host;
          const rootDomain = host.replace("app.", "");
          window.open(`${protocol}//${slug}.${rootDomain}`, "_blank");
        }
      },
      variant: "secondary" as const,
    },
  ];

  const allActions = [...actions, ...fixedActions];

  const toggleButtonVariants = {
    open: {
      scale: [1, 1.12, 1.05],
      rotate: [0, 6, -6, 0],
      transition: { duration: 0.35 },
    },
    closed: {
      scale: [1.05, 0.98, 1],
      rotate: [0, -4, 4, 0],
      transition: { duration: 0.28 },
    },
  };

  const toggleIconVariants = {
    open: {
      rotate: [0, 18, 0],
      scale: [1, 1.18, 1],
      opacity: [1, 0.85, 1],
      transition: { duration: 0.35 },
    },
    closed: {
      rotate: [0, -10, 0],
      scale: [1, 0.92, 1],
      transition: { duration: 0.25 },
    },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        ref={rootRef}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none"
      >
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-3 mb-2 pointer-events-auto">
              {allActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 group"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className="bg-background/90 backdrop-blur px-4 py-2 rounded-md text-sm font-medium shadow-md border hidden md:block cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {action.label}
                  </motion.button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={action.variant || "default"}
                          className="h-12 w-12 rounded-full shadow-lg"
                          onClick={() => {
                            action.onClick();
                            setIsOpen(false);
                          }}
                          disabled={
                            ("disabled" in action && action.disabled) ||
                            ("loading" in action && action.loading)
                          }
                        >
                          {"loading" in action && action.loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <action.icon className="h-5 w-5" />
                          )}
                          <TooltipContent side="left" className="md:hidden">
                            <p>{action.label}</p>
                          </TooltipContent>
                        </Button>
                      </TooltipTrigger>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <motion.div
          className="pointer-events-auto"
          variants={toggleButtonVariants}
          animate={isOpen ? "open" : "closed"}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl"
            onClick={toggleOpen}
            aria-expanded={isOpen}
          >
            <motion.span variants={toggleIconVariants}>
              <Sparkles className="h-6 w-6" />
            </motion.span>
          </Button>
        </motion.div>
      </div>

      {/* Modal de Selección de Idioma para Impresión */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Imprimir Carta</DialogTitle>
            <DialogDescription>
              Selecciona el idioma en el que deseas generar el menú para
              imprimir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-muted/50 border-2 hover:border-primary/50 transition-all"
              onClick={() => {
                const slug = session?.user?.slug;
                if (slug) {
                  const protocol = window.location.protocol;
                  const host = window.location.host;
                  const rootDomain = host.replace("app.", "");
                  window.open(
                    `${protocol}//${slug}.${rootDomain}/print?lang=es`,
                    "_blank",
                  );
                }
                setIsPrintModalOpen(false);
                setIsOpen(false);
              }}
            >
              <span className="text-2xl">🇪🇸</span>
              <span className="font-semibold">Español</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-muted/50 border-2 hover:border-primary/50 transition-all"
              onClick={() => {
                const slug = session?.user?.slug;
                if (slug) {
                  const protocol = window.location.protocol;
                  const host = window.location.host;
                  const rootDomain = host.replace("app.", "");
                  window.open(
                    `${protocol}//${slug}.${rootDomain}/print?lang=en`,
                    "_blank",
                  );
                }
                setIsPrintModalOpen(false);
                setIsOpen(false);
              }}
            >
              <span className="text-2xl">🇺🇸</span>
              <span className="font-semibold">Inglés</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
