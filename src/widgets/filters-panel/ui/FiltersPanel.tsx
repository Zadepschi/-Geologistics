import { Card } from "@/shared/ui/card/Card";
import styles from "./FiltersPanel.module.scss";
import { useOrdersLayerStore } from "@/features/toggle-orders-layer/model/store";
import { useMapThemeStore } from "@/features/switch-map-theme/model/store";
import { useClustersStore } from "@/features/switch-clusters/model/store";

export const FiltersPanel = () => {
  const { isVisible, toggle } = useOrdersLayerStore();
  const { theme, toggleTheme } = useMapThemeStore();
  const { isEnabled, toggleClusters } = useClustersStore();

  return (
    <Card className={styles.panel}>
      <div className={styles.title}>Filters & Actions</div>

      <div className={styles.group}>
        <button
          onClick={toggle}
          className={`${styles.action} ${!isVisible ? styles.primary : ""}`}
        >
          {isVisible ? "Hide Orders Layer" : "Show Orders Layer"}
        </button>

        <button
          onClick={toggleTheme}
          className={`${styles.action} ${theme === "outdoors" ? styles.primary : ""}`}
        >
          {theme === "dark" ? "Switch to Outdoors" : "Switch to Dark"}
        </button>

        <button
          onClick={toggleClusters}
          className={`${styles.action} ${isEnabled ? styles.primaryBlue : ""}`}
        >
          {isEnabled ? "Hide Clusters" : "Show Clusters"}
        </button>
      </div>
    </Card>
  );
};