import { useEffect, useState } from "react";
import type { Driver } from "@/entities/driver";
import { Modal } from "@/shared/ui/modal/Modal";
import { updateDriver } from "@/shared/api/drivers";
import styles from "./DriverEditModal.module.scss";

interface DriverEditModalProps {
  driver: Driver | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const DriverEditModal = ({
  driver,
  onClose,
  onUpdated,
}: DriverEditModalProps) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    status: "available" as Driver["status"],
    vehicleId: "",
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!driver) {
      return;
    }

    setForm({
      name: driver.name,
      phone: driver.phone,
      status: driver.status,
      vehicleId: driver.vehicleId ?? "",
    });
  }, [driver]);

  if (!driver) {
    return null;
  }

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

    setIsSubmitting(true);

    try {
      await updateDriver(driver.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        status: form.status,
        vehicleId: form.vehicleId || null,
      });

      onUpdated();
    } catch (error) {
      console.error(
        "Failed to update driver",
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={true}
      title="Edit driver"
      onClose={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
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
            disabled={isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <span>Phone</span>

          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 555 0101"
            required
            disabled={isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <span>Status</span>

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="available">
              Available
            </option>
            <option value="on-duty">
              On duty
            </option>
            <option value="off-duty">
              Off duty
            </option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Vehicle</span>

          <select
            name="vehicleId"
            value=""
            disabled
          >
            <option value="">
              Not assigned
            </option>
          </select>
        </label>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
};