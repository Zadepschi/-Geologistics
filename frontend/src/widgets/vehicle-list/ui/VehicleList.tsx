import { useState } from "react";
import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import { VehicleCard } from "@/entities/vehicle/ui/VehicleCard";
import type { Vehicle } from "@/entities/vehicle/model/types";
import { deleteVehicle } from "@/shared/api/vehicles";
import { VehicleEditModal } from "@/pages/fleet/ui/VehicleEditModal";
import { VehicleDeleteModal } from "@/pages/fleet/ui/VehicleDeleteModal";
import styles from "./VehicleList.module.scss";

export const VehicleList = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore(
    (s) => s.selectedVehicleId
  );
  const setSelectedVehicleId = useFleetStore(
    (s) => s.setSelectedVehicleId
  );

  const [search, setSearch] = useState("");

  const [vehicleToEdit, setVehicleToEdit] =
    useState<Vehicle | null>(null);

  const [vehicleToDelete, setVehicleToDelete] =
    useState<Vehicle | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const filteredVehicles = vehicles.filter(
    (vehicle) => {
      const query = search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        vehicle.name.toLowerCase().includes(query) ||
        vehicle.code.toLowerCase().includes(query)
      );
    }
  );

  const handleVehicleUpdated = () => {
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteVehicle(vehicleToDelete.id);

      setVehicleToDelete(null);

      window.location.reload();
    } catch (error) {
      console.error(
        "Failed to delete vehicle",
        error
      );

      window.alert(
        "This vehicle cannot be deleted because it is used by existing drivers or orders."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={styles.listCard}>
        <div className={styles.listHeader}>
          <h2>Vehicles</h2>
          <span>{vehicles.length}</span>
        </div>

        <div className={styles.search}>
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name or code..."
            aria-label="Search vehicles"
          />
        </div>

        <div className={styles.list}>
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={styles.vehicleItem}
            >
              <VehicleCard
                vehicle={vehicle}
                active={
                  vehicle.id === selectedVehicleId
                }
                onClick={() =>
                  setSelectedVehicleId(vehicle.id)
                }
              />

              <button
                type="button"
                className={styles.editButton}
                onClick={() =>
                  setVehicleToEdit(vehicle)
                }
              >
                Edit
              </button>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={() =>
                  setVehicleToDelete(vehicle)
                }
              >
                Delete
              </button>
            </div>
          ))}

          {filteredVehicles.length === 0 && (
            <div className={styles.empty}>
              No vehicles found.
            </div>
          )}
        </div>
      </Card>

      <VehicleEditModal
        vehicle={vehicleToEdit}
        onClose={() => setVehicleToEdit(null)}
        onUpdated={handleVehicleUpdated}
      />

      <VehicleDeleteModal
        vehicleName={
          vehicleToDelete?.name ?? null
        }
        open={vehicleToDelete !== null}
        loading={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setVehicleToDelete(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  );
};