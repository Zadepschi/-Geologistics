import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import type { Order } from "@/entities/order";
import { Modal } from "@/shared/ui/modal/Modal";
import { geocodeAddress } from "@/shared/api/geocodeAddress";
import { updateOrder } from "@/shared/api/orders";
import styles from "./EditOrderModal.module.scss";

interface EditOrderModalProps {
  open: boolean;
  order: Order | null;
  clients: Client[];
  onClose: () => void;
  onUpdated?: (
    order: Order,
    coordinates: {
      latitude: number;
      longitude: number;
    }
  ) => void;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const EditOrderModal = ({
  open,
  order,
  clients,
  onClose,
  onUpdated,
}: EditOrderModalProps) => {
  const [clientId, setClientId] = useState("");
  const [address, setAddress] = useState("");
  const [eta, setEta] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !order) {
      return;
    }

    setClientId(order.clientId);
    setAddress(order.address);
    setEta(
      typeof order.eta === "string"
        ? order.eta.slice(0, 5)
        : ""
    );
    setError("");
  }, [open, order]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setError("");
    onClose();
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!order || isSubmitting) {
      return;
    }

    if (!clientId) {
      setError("Please select a client.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }

    if (!eta) {
      setError("Please enter an ETA.");
      return;
    }

    if (!MAPBOX_TOKEN) {
      setError("Mapbox token is missing.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const coordinates = await geocodeAddress(
        address.trim()
      );

      const updatedOrder = await updateOrder(
        order.id,
        {
          clientId,
          address: address.trim(),
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          eta,
        }
      );

      onUpdated?.(updatedOrder, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      onClose();
    } catch (error) {
      console.error(
        `Failed to update order ${order.id}`,
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Edit order"
      onClose={handleClose}
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <label className={styles.field}>
          <span>Client</span>

          <select
            value={clientId}
            onChange={(event) =>
              setClientId(event.target.value)
            }
            disabled={isSubmitting}
          >
            <option value="">
              Select client
            </option>

            {clients.map((client) => (
              <option
                key={client.id}
                value={client.id}
              >
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Delivery address</span>

          <input
            type="text"
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            disabled={isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <span>ETA</span>

          <input
            type="time"
            value={eta}
            onChange={(event) =>
              setEta(event.target.value)
            }
            disabled={isSubmitting}
          />
        </label>

        {error && (
          <p className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
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