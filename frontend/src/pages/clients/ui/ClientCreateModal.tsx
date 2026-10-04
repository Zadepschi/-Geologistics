import { useState, type FormEvent } from "react";
import { AddressAutofill } from "@mapbox/search-js-react";
import { Modal } from "@/shared/ui/modal/Modal";
import { createClient } from "@/shared/api/clients";
import styles from "./ClientCreateModal.module.scss";

interface ClientCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ?? "";

export const ClientCreateModal = ({
  open,
  onClose,
  onCreated,
}: ClientCreateModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

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

    if (!street || !city || !state || !zipCode) {
      setError(
        "Please select a complete address from the Mapbox suggestions."
      );
      return;
    }

    try {
      await createClient({
        name,
        phone,
        email,
        address,
      });

      onCreated();

      setName("");
      setPhone("");
      setEmail("");
      setError("");

      onClose();
    } catch (requestError) {
      console.error(
        "Failed to create client",
        requestError
      );

      setError(
        "Failed to create client. Please try again."
      );
    }
  };

  return (
    <Modal
      open={open}
      title="Create client"
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
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Client name"
            autoComplete="off"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Phone</span>

          <input
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="+1 555 0000"
            autoComplete="tel"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Email</span>

          <input
            name="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="client@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Country</span>

          <input
            type="text"
            value="United States"
            readOnly
            autoComplete="country-name"
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
                required
              />
            </label>
          </div>
        </AddressAutofill>

        {error && (
          <p className={styles.actionError}>
            {error}
          </p>
        )}

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
            Create client
          </button>
        </div>
      </form>
    </Modal>
  );
};