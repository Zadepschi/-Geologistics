import { useEffect, useState } from "react";
import type { Vehicle } from "@/entities/vehicle/model/types";
import { Modal } from "@/shared/ui/modal/Modal";
import { updateVehicle } from "@/shared/api/vehicles";
import styles from "./VehicleCreateModal.module.scss";

interface VehicleEditModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const VehicleEditModal = ({
  vehicle,
  onClose,
  onUpdated,
}: VehicleEditModalProps) => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "truck" as "truck" | "van" | "bike",
  });

  useEffect(() => {
    if (!vehicle) {
      return;
    }

    setForm({
      code: vehicle.code,
      name: vehicle.name,
      type: vehicle.type,
    });
  }, [vehicle]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!vehicle) {
      return;
    }

    try {
      await updateVehicle(vehicle.id, {
        code: form.code,
        name: form.name,
        type: form.type,
        status: vehicle.status,
        telemetry: {
          lat: vehicle.telemetry.lat,
          lng: vehicle.telemetry.lng,
          speedKmH:
            vehicle.telemetry.speedKmH ?? null,
          heading:
            vehicle.telemetry.heading ?? null,
          updatedAt:
            vehicle.telemetry.updatedAt ?? null,
        },
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error(
        "Failed to update vehicle",
        error
      );
    }
  };

  return (
    <Modal
      open={vehicle !== null}
      title="Edit vehicle"
      onClose={onClose}
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <label className={styles.field}>
          <span>Code</span>

          <input
            name="code"
            value={form.code}
            onChange={handleChange}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Name</span>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Type</span>

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="bike">Bike</option>
          </select>
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={styles.submitButton}
          >
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
};