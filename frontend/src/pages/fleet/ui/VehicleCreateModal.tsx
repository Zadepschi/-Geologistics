import { useState, type FormEvent } from "react";
import { AddressAutofill } from "@mapbox/search-js-react";
import { Modal } from "@/shared/ui/modal/Modal";
import { createVehicle } from "@/shared/api/vehicles";
import { geocodeAddress } from "@/shared/api/geocodeAddress";
import styles from "./VehicleCreateModal.module.scss";

interface VehicleCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ?? "";

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

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
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

    const address = [
      street,
      city,
      state,
      zipCode,
      country,
    ]
      .filter(Boolean)
      .join(", ");

    if (!form.code.trim()) {
      setError("Please enter a vehicle code.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a vehicle name.");
      return;
    }

    if (!street || !city || !state || !zipCode) {
      setError(
        "Please select a complete address from the Mapbox suggestions."
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const coordinates =
        await geocodeAddress(address);

      await createVehicle({
        id: `vehicle-${Date.now()}`,
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        status: "idle",
        telemetry: {
          lat: coordinates.latitude,
          lng: coordinates.longitude,
          speedKmH: 0,
          heading: 0,
          updatedAt: new Date().toISOString(),
        },
      });

      onCreated();

      setForm({
        code: "",
        name: "",
        type: "truck",
      });

      setError("");
      onClose();
    } catch (requestError) {
      console.error(
        "Failed to create vehicle",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create vehicle."
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

  return (
    <Modal
      open={open}
      title="Create vehicle"
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
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                code: event.target.value,
              }))
            }
            placeholder="101"
            disabled={isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Name</span>

          <input
            name="name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Truck #101"
            disabled={isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Type</span>

          <select
            name="type"
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as
                  | "truck"
                  | "van"
                  | "bike",
              }))
            }
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
              ? "Creating..."
              : "Create vehicle"}
          </button>
        </div>
      </form>
    </Modal>
  );
};