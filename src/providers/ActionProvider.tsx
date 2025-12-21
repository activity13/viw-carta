"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { LucideIcon } from "lucide-react";

export interface FabAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}

interface ActionContextType {
  actions: FabAction[];
  setActions: (actions: FabAction[]) => void;
  registerAction: (action: FabAction) => void;
  clearActions: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<FabAction[]>([]);

  const registerAction = useCallback((action: FabAction) => {
    setActions((prev) => [...prev, action]);
  }, []);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  return (
    <ActionContext.Provider
      value={{ actions, setActions, registerAction, clearActions }}
    >
      {children}
    </ActionContext.Provider>
  );
}

export function useFab() {
  const context = useContext(ActionContext);
  if (context === undefined) {
    throw new Error("useFab must be used within an ActionProvider");
  }
  return context;
}
