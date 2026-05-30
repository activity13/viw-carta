"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Eye, Loader2, Printer } from "lucide-react";
import { useFab } from "@/providers/ActionProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const pathname = usePathname();
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
      icon: Eye,
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

  // Extract direct selling actions to promote to foreground
  const activeOrderAction = actions.find((a) => a.label.startsWith("Ver Orden"));
  const holdOrdersAction = actions.find((a) => a.label.startsWith("Órdenes"));
  const createOrderAction = actions.find((a) => a.label.startsWith("Nueva Orden"));

  const primarySellAction = activeOrderAction || holdOrdersAction || createOrderAction;

  // Exclude the promoted action from the expanded vertical list
  const menuActions = actions.filter((a) => a !== primarySellAction);
  const allActions = [...menuActions, ...fixedActions];

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

  if (pathname === "/backoffice/login") return null;

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

        {primarySellAction ? (
          /* Sleek unified control containing the primary selling action and sparkles menu toggler */
          <motion.div
            className="pointer-events-auto flex items-center gap-2 bg-background/95 backdrop-blur border border-border shadow-2xl rounded-full p-1.5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Direct Action Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      primarySellAction.onClick();
                      setIsOpen(false);
                    }}
                    disabled={
                      ("disabled" in primarySellAction && primarySellAction.disabled) ||
                      ("loading" in primarySellAction && primarySellAction.loading)
                    }
                    className={cn(
                      "rounded-full px-4 h-11 text-xs md:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all duration-300 border-0 text-white shrink-0 active:scale-[0.98] select-none",
                      primarySellAction.label.startsWith("Ver Orden")
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.35)]"
                        : primarySellAction.label.startsWith("Órdenes")
                          ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    )}
                  >
                    {"loading" in primarySellAction && primarySellAction.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : (
                      <primarySellAction.icon className="h-4 w-4 shrink-0" />
                    )}

                    {/* Responsive text presentation */}
                    <span className="hidden sm:inline">{primarySellAction.label}</span>
                    <span className="inline sm:hidden">
                      {primarySellAction.label.startsWith("Ver Orden")
                        ? primarySellAction.label.replace("Ver Orden #", "#")
                        : primarySellAction.label.startsWith("Órdenes")
                          ? primarySellAction.label
                          : "Vender"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{primarySellAction.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Visual Separator */}
            <div className="w-[1px] h-6 bg-border/85 self-center" />

            {/* Sparkles Menu Trigger */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer shadow-none shrink-0"
                    onClick={toggleOpen}
                    aria-expanded={isOpen}
                  >
                    <motion.span
                      variants={toggleIconVariants}
                      animate={isOpen ? "open" : "closed"}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{isOpen ? "Cerrar" : "Más acciones"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        ) : (
          /* Graceful standard fallback Sparkles FAB */
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
        )}
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
