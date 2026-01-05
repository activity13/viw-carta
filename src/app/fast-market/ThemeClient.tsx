"use client";

import { useEffect } from "react";
import styles from "./theme.module.css";

type ThemeClientProps = {
  fontVariableClasses: string;
};

export default function ThemeClient({ fontVariableClasses }: ThemeClientProps) {
  useEffect(() => {
    const root = document.documentElement;

    const classesToAdd = [
      styles.themeFastMarket,
      ...fontVariableClasses.split(" "),
    ].filter(Boolean);

    root.classList.add(...classesToAdd);

    return () => {
      root.classList.remove(...classesToAdd);
    };
  }, [fontVariableClasses]);

  return null;
}
