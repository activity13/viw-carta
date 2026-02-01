"use client";

import { createContext, useContext } from "react";

const MenuContext = createContext(null);

export function MenuProvider({ children, data }) {
  return <MenuContext.Provider value={data}>{children}</MenuContext.Provider>;
}

export function useMenuData() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenuData debe usarse dentro de un MenuProvider");
  }
  return context;
}
