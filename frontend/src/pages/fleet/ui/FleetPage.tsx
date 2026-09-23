import { useState } from "react";
import { FleetStats } from "@/widgets/fleet-stats";
import { VehicleList } from "@/widgets/vehicle-list";
import { VehicleDetails } from "@/widgets/vehicle-details";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { VehicleCreateModal } from "./VehicleCreateModal";

import styles from "./FleetPage.module.scss";

export const FleetPage = () => {
  useLoadVehicles();

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const handleVehicleCreated = () => {
    window.location.reload();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.subtitle}>
            Manage and monitor all vehicles.
          </p>
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Add vehicle
        </button>
      </div>

      <FleetStats />

      <div className={styles.contentGrid}>
        <VehicleList />
        <VehicleDetails />
      </div>

      <VehicleCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleVehicleCreated}
      />
    </div>
  );
};