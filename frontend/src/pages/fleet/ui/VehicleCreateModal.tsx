import { useState } from "react";
import { Modal } from "@/shared/ui/modal/Modal";
import { createVehicle } from "@/shared/api/vehicles";
import styles from "./VehicleCreateModal.module.scss";

interface VehicleCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const VehicleCreateModal = ({
  open,
  onClose,
  onCreated,
}: VehicleCreateModalProps) => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "truck" as "truck" | "van" | "bike",
  });

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

    try {
      await createVehicle({
        id: `vehicle-${Date.now()}`,
        code: form.code,
        name: form.name,
        type: form.type,
        status: "idle",
        telemetry: {
          lat: null,
          lng: null,
          speedKmH: null,
          heading: null,
        },
      });

      onCreated();

      setForm({
        code: "",
        name: "",
        type: "truck",
      });

      onClose();
    } catch (error) {
      console.error(
        "Failed to create vehicle",
        error
      );
    }
  };

  return (
    <Modal
      open={open}
      title="Create vehicle"
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
            placeholder="101"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Name</span>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Truck #101"
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
            Create vehicle
          </button>
        </div>
      </form>
    </Modal>
  );
};