import { useState } from "react";
import { DriversList } from "@/widgets/drivers-list";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { useFleetStore } from "@/shared/store/fleet";
import { DriverCreateModal } from "./DriverCreateModal";

import styles from "./DriversPage.module.scss";

export const DriversPage = () => {
  useLoadVehicles();

  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const handleDriverCreated = () => {
    window.location.reload();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Manage drivers and monitor their assigned
          vehicles.
        </p>

        <button
          type="button"
          className={styles.addButton}
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Add driver
        </button>
      </div>

      <DriversList />

      <DriverCreateModal
        open={isCreateModalOpen}
        vehicles={vehicles}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleDriverCreated}
      />
    </div>
  );
};