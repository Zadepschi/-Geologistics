import { Card } from "@/shared/ui/card/Card";
import styles from "./FiltersPanel.module.scss";
import { useOrdersLayerStore } from "@/features/toggle-orders-layer/model/store";
import { useClustersStore } from "@/features/switch-clusters/model/store";

export const FiltersPanel = () => {
  const { isVisible, toggle } = useOrdersLayerStore();
  const { isEnabled, toggleClusters } = useClustersStore();

  return (
    <Card className={styles.panel}>
      <div className={styles.title}></div>

      <div className={styles.group}>
        <button
          onClick={toggle}
          className={`${styles.action} ${!isVisible ? styles.primary : ""}`}
        >
          {isVisible ? "Hide Orders Layer" : "Show Orders Layer"}
        </button>

        <button
          onClick={toggleClusters}
          className={`${styles.action} ${isEnabled ? styles.primary : ""}`}
        >
          {isEnabled ? "Hide Clusters" : "Show Clusters"}
        </button>
      </div>
    </Card>
  );
};