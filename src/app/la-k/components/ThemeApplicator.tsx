"use client";

import { useEffect } from "react";
import styles from "../theme.module.css";

export default function ThemeApplicator() {
  useEffect(() => {
    // Apply the hashed theme class to the body so portals (Dialogs) inherit the CSS variables
    document.body.classList.add(styles.themeLaK);
    
    // Set color-scheme to light for this specific brand identity
    const originalColorScheme = document.body.style.colorScheme;
    document.body.style.colorScheme = "light";

    return () => {
      document.body.classList.remove(styles.themeLaK);
      document.body.style.colorScheme = originalColorScheme;
    };
  }, []);

  return null;
}
