import { useState } from "react";
import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import { VehicleCard } from "@/entities/vehicle/ui/VehicleCard";
import type { Vehicle } from "@/entities/vehicle/model/types";
import {
  archiveVehicle,
} from "@/shared/api/vehicles";
import { VehicleEditModal } from "@/pages/fleet/ui/VehicleEditModal";
import { VehicleDeleteModal } from "@/pages/fleet/ui/VehicleDeleteModal";
import styles from "./VehicleList.module.scss";

type VehicleFilter =
  | "all"
  | "on-route"
  | "idle"
  | "archived";

export const VehicleList = () => {
  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

  const selectedVehicleId = useFleetStore(
    (state) => state.selectedVehicleId
  );

  const setSelectedVehicleId = useFleetStore(
    (state) => state.setSelectedVehicleId
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<VehicleFilter>("all");

  const [vehicleToEdit, setVehicleToEdit] =
    useState<Vehicle | null>(null);

  const [vehicleToArchive, setVehicleToArchive] =
    useState<Vehicle | null>(null);

  const [isArchiving, setIsArchiving] =
    useState(false);

  const [archiveError, setArchiveError] =
    useState("");

  const activeVehicles = vehicles.filter(
    (vehicle) => !vehicle.isArchived
  );

  const archivedVehicles = vehicles.filter(
    (vehicle) => vehicle.isArchived
  );

  const filteredVehicles = vehicles.filter(
    (vehicle) => {
      const query = search
        .trim()
        .toLowerCase();

      const matchesSearch =
        !query ||
        vehicle.name
          .toLowerCase()
          .includes(query) ||
        vehicle.code
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (filter === "archived") {
        return vehicle.isArchived;
      }

      if (vehicle.isArchived) {
        return false;
      }

      if (filter === "all") {
        return true;
      }

      return vehicle.status === filter;
    }
  );

  const handleVehicleUpdated = () => {
    window.location.reload();
  };

  const handleArchive = async () => {
    if (!vehicleToArchive) {
      return;
    }

    setIsArchiving(true);
    setArchiveError("");

    try {
      await archiveVehicle(
        vehicleToArchive.id,
        !vehicleToArchive.isArchived
      );

      setVehicleToArchive(null);

      window.location.reload();
    } catch (error) {
      console.error(
        "Failed to archive vehicle",
        error
      );

      setArchiveError(
        vehicleToArchive.isArchived
          ? "Failed to restore this vehicle."
          : "Failed to archive this vehicle."
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveClick = (
    vehicle: Vehicle
  ) => {
    setArchiveError("");
    setVehicleToArchive(vehicle);
  };

  return (
    <>
      <Card className={styles.listCard}>
        <div className={styles.listHeader}>
          <h2>Vehicles</h2>

          <div className={styles.filters}>
            <button
              type="button"
              className={
                filter === "all"
                  ? styles.filterButtonActive
                  : styles.filterButton
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All active
              <span>
                {activeVehicles.length}
              </span>
            </button>

            <button
              type="button"
              className={
                filter === "on-route"
                  ? styles.filterButtonActive
                  : styles.filterButton
              }
              onClick={() =>
                setFilter("on-route")
              }
            >
              On route
              <span>
                {
                  activeVehicles.filter(
                    (vehicle) =>
                      vehicle.status ===
                      "on-route"
                  ).length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                filter === "idle"
                  ? styles.filterButtonActive
                  : styles.filterButton
              }
              onClick={() =>
                setFilter("idle")
              }
            >
              Idle
              <span>
                {
                  activeVehicles.filter(
                    (vehicle) =>
                      vehicle.status ===
                      "idle"
                  ).length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                filter === "archived"
                  ? styles.filterButtonActive
                  : styles.filterButton
              }
              onClick={() =>
                setFilter("archived")
              }
            >
              Archived
              <span>
                {archivedVehicles.length}
              </span>
            </button>
          </div>
        </div>

        <div className={styles.search}>
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search by name or code..."
            aria-label="Search vehicles"
          />
        </div>

        <div className={styles.list}>
          {filteredVehicles.map(
            (vehicle) => (
              <div
                key={vehicle.id}
                className={styles.vehicleItem}
              >
                <VehicleCard
                  vehicle={vehicle}
                  active={
                    vehicle.id ===
                    selectedVehicleId
                  }
                  onClick={() =>
                    setSelectedVehicleId(
                      vehicle.id
                    )
                  }
                />

                {filter !== "archived" && (
                  <button
                    type="button"
                    className={
                      styles.editButton
                    }
                    onClick={() =>
                      setVehicleToEdit(
                        vehicle
                      )
                    }
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  className={
                    styles.deleteButton
                  }
                  onClick={() =>
                    handleArchiveClick(
                      vehicle
                    )
                  }
                >
                  {vehicle.isArchived
                    ? "Restore"
                    : "Archive"}
                </button>
              </div>
            )
          )}

          {filteredVehicles.length ===
            0 && (
            <div className={styles.empty}>
              {filter === "archived"
                ? "No archived vehicles."
                : "No vehicles found."}
            </div>
          )}
        </div>
      </Card>

      <VehicleEditModal
        vehicle={vehicleToEdit}
        onClose={() =>
          setVehicleToEdit(null)
        }
        onUpdated={
          handleVehicleUpdated
        }
      />

      <VehicleDeleteModal
        vehicleName={
          vehicleToArchive?.name ?? null
        }
        isArchived={
          vehicleToArchive?.isArchived ??
          false
        }
        open={
          vehicleToArchive !== null
        }
        loading={isArchiving}
        error={archiveError}
        onClose={() => {
          if (!isArchiving) {
            setVehicleToArchive(null);
            setArchiveError("");
          }
        }}
        onConfirm={handleArchive}
      />
    </>
  );
};