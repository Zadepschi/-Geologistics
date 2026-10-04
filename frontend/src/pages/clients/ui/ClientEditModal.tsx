import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import { updateClient } from "@/shared/api/clients";
import { Modal } from "@/shared/ui/modal/Modal";
import styles from "./ClientCreateModal.module.scss";

interface ClientEditModalProps {
  client: Client | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const ClientEditModal = ({
  client,
  onClose,
  onUpdated,
}: ClientEditModalProps) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  useEffect(() => {
    if (!client) {
      return;
    }

    const addressParts = client.address
      .split(",")
      .map((part) => part.trim());

    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email,
      street: addressParts[0] ?? "",
      city: addressParts[1] ?? "",
      state: addressParts[2] ?? "",
      zipCode: addressParts[3] ?? "",
      country:
        addressParts.slice(4).join(", ") ||
        "United States",
    });
  }, [client]);

  if (!client) {
    return null;
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
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

    const address = [
      form.street,
      form.city,
      form.state,
      form.zipCode,
      form.country,
    ]
      .filter(Boolean)
      .join(", ");

    try {
      await updateClient(client.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address,
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error(
        "Failed to update client",
        error
      );
    }
  };

  return (
    <Modal
      open={Boolean(client)}
      title="Edit client"
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
            value={form.name}
            onChange={handleChange}
            placeholder="Client name"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Phone</span>

          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+1 555 0000"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Email</span>

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="client@example.com"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Street address</span>

          <input
            name="street"
            type="text"
            value={form.street}
            onChange={handleChange}
            placeholder="1600 Pennsylvania Ave NW"
            required
          />
        </label>

        <label className={styles.field}>
          <span>City</span>

          <input
            name="city"
            type="text"
            value={form.city}
            onChange={handleChange}
            placeholder="Washington"
            required
          />
        </label>

        <label className={styles.field}>
          <span>State</span>

          <input
            name="state"
            type="text"
            value={form.state}
            onChange={handleChange}
            placeholder="DC"
            required
          />
        </label>

        <label className={styles.field}>
          <span>ZIP code</span>

          <input
            name="zipCode"
            type="text"
            value={form.zipCode}
            onChange={handleChange}
            placeholder="20500"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Country</span>

          <input
            name="country"
            type="text"
            value={form.country}
            onChange={handleChange}
            placeholder="United States"
            required
          />
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