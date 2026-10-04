import { useState } from "react";
import type { Driver } from "@/entities/driver";
import { DriversList } from "@/widgets/drivers-list";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { useFleetStore } from "@/shared/store/fleet";
import { DriverCreateModal } from "./DriverCreateModal";
import { DriverEditModal } from "./DriverEditModal";

import styles from "./DriversPage.module.scss";

export const DriversPage = () => {
  useLoadVehicles();

  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [selectedDriver, setSelectedDriver] =
    useState<Driver | null>(null);

  const handleDriverCreated = () => {
    window.location.reload();
  };

  const handleDriverUpdated = () => {
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
          onClick={() =>
            setIsCreateModalOpen(true)
          }
        >
          + Add driver
        </button>
      </div>

      <div className={styles.content}>
        <DriversList
          onEdit={setSelectedDriver}
        />
      </div>

      <DriverCreateModal
        open={isCreateModalOpen}
        vehicles={vehicles}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        onCreated={handleDriverCreated}
      />

      <DriverEditModal
        driver={selectedDriver}
        onClose={() =>
          setSelectedDriver(null)
        }
        onUpdated={handleDriverUpdated}
      />
    </div>
  );
};