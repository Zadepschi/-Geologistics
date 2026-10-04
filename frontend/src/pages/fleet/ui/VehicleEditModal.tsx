import { useEffect, useState, type FormEvent } from "react";
import { AddressAutofill } from "@mapbox/search-js-react";
import type { Vehicle } from "@/entities/vehicle/model/types";
import { Modal } from "@/shared/ui/modal/Modal";
import { updateVehicle } from "@/shared/api/vehicles";
import { geocodeAddress } from "@/shared/api/geocodeAddress";
import styles from "./VehicleCreateModal.module.scss";

interface VehicleEditModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onUpdated: () => void;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ?? "";

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

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!vehicle) {
      return;
    }

    setForm({
      code: vehicle.code,
      name: vehicle.name,
      type: vehicle.type,
    });

    setError("");
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

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!vehicle || isSubmitting) {
      return;
    }

    const formData = new FormData(
      event.currentTarget
    );

    const street =
      String(formData.get("street") ?? "").trim();

    const city =
      String(formData.get("city") ?? "").trim();

    const state =
      String(formData.get("state") ?? "").trim();

    const zipCode =
      String(formData.get("zipCode") ?? "").trim();

    const country = "United States";

    if (!street || !city || !state || !zipCode) {
      setError(
        "Please select a complete address from the Mapbox suggestions."
      );
      return;
    }

    const address = [
      street,
      city,
      state,
      zipCode,
      country,
    ]
      .filter(Boolean)
      .join(", ");

    setError("");
    setIsSubmitting(true);

    try {
      const coordinates =
        await geocodeAddress(address);

      await updateVehicle(vehicle.id, {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        status: vehicle.status,
        telemetry: {
          lat: coordinates.latitude,
          lng: coordinates.longitude,
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
    } catch (requestError) {
      console.error(
        "Failed to update vehicle",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update vehicle."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setError("");
    onClose();
  };

  if (!vehicle) {
    return null;
  }

  return (
    <Modal
      open={vehicle !== null}
      title="Edit vehicle"
      onClose={handleClose}
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
            disabled={isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Name</span>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Type</span>

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="truck">
              Truck
            </option>

            <option value="van">
              Van
            </option>

            <option value="bike">
              Bike
            </option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Country</span>

          <input
            type="text"
            value="United States"
            readOnly
            autoComplete="country-name"
            disabled={isSubmitting}
          />
        </label>

        <AddressAutofill
          accessToken={MAPBOX_TOKEN}
          options={{
            country: "us",
            language: "en",
            limit: 8,
            streets: true,
          }}
          browserAutofillEnabled={false}
        >
          <div className={styles.addressFields}>
            <label className={styles.field}>
              <span>Street address</span>

              <input
                name="street"
                type="text"
                autoComplete="address-line1"
                placeholder="Start typing an address..."
                disabled={isSubmitting}
                required
              />
            </label>

            <label className={styles.field}>
              <span>City</span>

              <input
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder="City"
                disabled={isSubmitting}
                required
              />
            </label>

            <label className={styles.field}>
              <span>State</span>

              <input
                name="state"
                type="text"
                autoComplete="address-level1"
                placeholder="State"
                disabled={isSubmitting}
                required
              />
            </label>

            <label className={styles.field}>
              <span>ZIP code</span>

              <input
                name="zipCode"
                type="text"
                autoComplete="postal-code"
                placeholder="ZIP code"
                disabled={isSubmitting}
                required
              />
            </label>
          </div>
        </AddressAutofill>

        {error && (
          <p className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
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