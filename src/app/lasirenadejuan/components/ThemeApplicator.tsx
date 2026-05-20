"use client";

import { useEffect } from "react";
import styles from "../theme.module.css";

export default function ThemeApplicator() {
  useEffect(() => {
    document.documentElement.classList.add(styles.themeSirena);
    return () => {
      document.documentElement.classList.remove(styles.themeSirena);
    };
  }, []);

  return null;
}
