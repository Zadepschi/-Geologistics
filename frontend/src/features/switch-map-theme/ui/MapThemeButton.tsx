
import { Sun, Moon } from "lucide-react";
import { useMapThemeStore } from "../model/store";
import styles from "./MapThemeButton.module.scss";

export const MapThemeButton = () => {
  const theme = useMapThemeStore((state) => state.theme);
  const toggleTheme = useMapThemeStore(
    (state) => state.toggleTheme
  );

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={styles.button}
      onClick={toggleTheme}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>
        {isDark ? "Switch to Outdoor" : "Switch to Dark"}
      </span>
    </button>
  );
};
