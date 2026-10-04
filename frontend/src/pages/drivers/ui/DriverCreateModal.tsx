import { useState } from "react";
import type { Vehicle } from "@/entities/vehicle/model/types";
import { Modal } from "@/shared/ui/modal/Modal";
import { createDriver } from "@/shared/api/drivers";
import styles from "./DriverCreateModal.module.scss";

interface DriverCreateModalProps {
  open: boolean;
  vehicles: Vehicle[];
  onClose: () => void;
  onCreated: () => void;
}

export const DriverCreateModal = ({
  open,
  onClose,
  onCreated,
}: DriverCreateModalProps) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleId: "",
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
      await createDriver({
        id: `driver-${Date.now()}`,
        name: form.name,
        phone: form.phone,
        status: "available",
        vehicleId: form.vehicleId || null,
      });

      onCreated();

      setForm({
        name: "",
        phone: "",
        vehicleId: "",
      });

      onClose();
    } catch (error) {
      console.error(
        "Failed to create driver",
        error
      );
    }
  };

  return (
    <Modal
      open={open}
      title="Create driver"
      onClose={onClose}
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <label className={styles.field}>
          <span>Name</span>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="D. Miller"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Phone</span>

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 555 0101"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Vehicle</span>

          <select
            name="vehicleId"
            value={form.vehicleId}
            onChange={handleChange}
          >
            <option value="">
              Not assigned
            </option>

           {/* 
            {vehicles.map((vehicle) => (
             <option
             key={vehicle.id}
             value={vehicle.id}
              >
            {vehicle.name}
             </option>
            ))}
          */}

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
            Create driver
          </button>
        </div>
      </form>
    </Modal>
  );
};