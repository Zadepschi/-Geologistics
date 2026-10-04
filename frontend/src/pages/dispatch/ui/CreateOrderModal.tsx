import {
  useEffect,
  useState,
} from "react";
import type { Client } from "@/entities/client";
import type { Vehicle } from "@/entities/vehicle";
import type { Driver } from "@/entities/driver";
import type { Order } from "@/entities/order";
import { Modal } from "@/shared/ui/modal/Modal";
import { createOrder } from "@/shared/api/orders";
import { fetchOrders } from "@/shared/api/orders";
import { geocodeAddress } from "@/shared/api/geocodeAddress";
import { fetchStreetRouteWithDuration } from "@/shared/api/fetchStreetRoute";
import styles from "./CreateOrderModal.module.scss";

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN;

interface CreateOrderModalProps {
  open: boolean;
  clients: Client[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
  onCreated?: () => void;
}

const formatEta = (durationMinutes: number) => {
  const eta = new Date(
    Date.now() +
      durationMinutes * 60 * 1000
  );

  return eta.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const CreateOrderModal = ({
  open,
  clients,
  vehicles,
  drivers,
  onClose,
  onCreated,
}: CreateOrderModalProps) => {
  const [clientId, setClientId] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [vehicleId, setVehicleId] =
    useState("");

  const [driverId, setDriverId] =
    useState("");

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error(
          "Failed to load orders for driver availability",
          error
        );
      });
  }, [open]);

  const availableClients =
    clients.filter(
      (client) => !client.isArchived
    );

  const availableVehicles =
    vehicles.filter(
      (vehicle) =>
        !vehicle.isArchived &&
        vehicle.status === "idle"
    );

  const activeDrivers =
    drivers.filter(
      (driver) => !driver.isArchived
    );

  const getDriverAvailability = (
    driver: Driver
  ) => {
    const activeOrder = orders.find(
      (order) =>
        order.driverId === driver.id &&
        (
          order.status === "assigned" ||
          order.status === "in-progress" ||
          order.status === "delayed"
        )
    );

    if (activeOrder) {
      if (
        activeOrder.status ===
        "in-progress"
      ) {
        return {
          available: false,
          label: "on-route",
        };
      }

      if (
        activeOrder.status ===
        "delayed"
      ) {
        return {
          available: false,
          label: "delayed",
        };
      }

      return {
        available: false,
        label: "on-duty",
      };
    }

    if (driver.status !== "available") {
      return {
        available: false,
        label: driver.status,
      };
    }

    if (driver.vehicleId) {
      const assignedVehicle =
        vehicles.find(
          (vehicle) =>
            vehicle.id === driver.vehicleId
        );

      if (
        assignedVehicle?.status ===
        "on-route"
      ) {
        return {
          available: false,
          label: "on-route",
        };
      }

      if (
        assignedVehicle?.status ===
        "maintenance"
      ) {
        return {
          available: false,
          label: "maintenance",
        };
      }

      if (
        assignedVehicle?.status ===
        "delayed"
      ) {
        return {
          available: false,
          label: "delayed",
        };
      }
    }

    return {
      available: true,
      label: "available",
    };
  };

  const availableDrivers =
    activeDrivers.filter(
      (driver) =>
        getDriverAvailability(driver)
          .available
    );

  const handleClientChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedClientId =
      event.target.value;

    setClientId(selectedClientId);
    setError("");

    const selectedClient =
      availableClients.find(
        (client) =>
          client.id === selectedClientId
      );

    setAddress(
      selectedClient?.address ?? ""
    );
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setClientId("");
    setAddress("");
    setVehicleId("");
    setDriverId("");
    setError("");

    onClose();
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const selectedClient =
      availableClients.find(
        (client) => client.id === clientId
      );

    if (!selectedClient) {
      setError("Please select a client.");
      return;
    }

    if (!selectedClient.address?.trim()) {
      setError(
        "Selected client does not have an address."
      );
      return;
    }

    const selectedVehicle =
      availableVehicles.find(
        (vehicle) =>
          vehicle.id === vehicleId
      );

    if (!selectedVehicle) {
      setError("Please select a vehicle.");
      return;
    }

    if (selectedVehicle.status !== "idle") {
      setError(
        "Selected vehicle is not available."
      );
      return;
    }

    const selectedDriver =
      activeDrivers.find(
        (driver) => driver.id === driverId
      );

    if (!selectedDriver) {
      setError("Please select a driver.");
      return;
    }

    const driverAvailability =
      getDriverAvailability(
        selectedDriver
      );

    if (!driverAvailability.available) {
      setError(
        `Selected driver is not available (${driverAvailability.label}).`
      );
      return;
    }

    if (
      selectedDriver.vehicleId &&
      selectedDriver.vehicleId !== vehicleId
    ) {
      setError(
        "Selected driver is assigned to another vehicle."
      );
      return;
    }

    if (
      typeof selectedVehicle.telemetry
        .lat !== "number" ||
      typeof selectedVehicle.telemetry
        .lng !== "number"
    ) {
      setError(
        "Selected vehicle does not have a valid location."
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const coordinates =
        await geocodeAddress(
          selectedClient.address
        );

      const start: [number, number] = [
        selectedVehicle.telemetry.lng,
        selectedVehicle.telemetry.lat,
      ];

      const finish: [number, number] = [
        coordinates.longitude,
        coordinates.latitude,
      ];

      const route =
        await fetchStreetRouteWithDuration(
          start,
          finish,
          MAPBOX_TOKEN
        );

      const eta = formatEta(
        route.durationMinutes
      );

      await createOrder({
        clientId,
        address: selectedClient.address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        vehicleId,
        driverId,
        eta,
      });

      setClientId("");
      setAddress("");
      setVehicleId("");
      setDriverId("");
      setError("");

      onCreated?.();
      onClose();
    } catch (error) {
      console.error(
        "Failed to create order:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create order."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create order"
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
            onChange={handleClientChange}
            required
            disabled={isSubmitting}
          >
            <option value="">
              Select client
            </option>

            {availableClients.map(
              (client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </option>
              )
            )}
          </select>
        </label>

        <label className={styles.field}>
          <span>Delivery address</span>

          <input
            type="text"
            value={address}
            placeholder={
              clientId
                ? "Client address"
                : "Select a client first"
            }
            readOnly
            required
            disabled={
              isSubmitting ||
              !clientId
            }
          />
        </label>

        <label className={styles.field}>
          <span>Vehicle</span>

          <select
            value={vehicleId}
            onChange={(event) =>
              setVehicleId(
                event.target.value
              )
            }
            required
            disabled={isSubmitting}
          >
            <option value="">
              Select vehicle
            </option>

            {availableVehicles.map(
              (vehicle) => (
                <option
                  key={vehicle.id}
                  value={vehicle.id}
                >
                  {vehicle.name} (
                  {vehicle.code})
                </option>
              )
            )}
          </select>
        </label>

        <label className={styles.field}>
          <span>Driver</span>

          <select
            value={driverId}
            onChange={(event) =>
              setDriverId(
                event.target.value
              )
            }
            required
            disabled={isSubmitting}
          >
            <option value="">
              Select driver
            </option>

            {activeDrivers.map((driver) => {
              const availability =
                getDriverAvailability(
                  driver
                );

              return (
                <option
                  key={driver.id}
                  value={driver.id}
                  disabled={
                    !availability.available
                  }
                >
                  {driver.name}
                  {!availability.available
                    ? ` (${availability.label})`
                    : ""}
                </option>
              );
            })}
          </select>
        </label>

        {availableClients.length ===
          0 && (
          <p className={styles.error}>
            No active clients.
          </p>
        )}

        {availableVehicles.length ===
          0 && (
          <p className={styles.error}>
            No available vehicles.
          </p>
        )}

        {availableDrivers.length ===
          0 && (
          <p className={styles.error}>
            No available drivers.
          </p>
        )}

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
            disabled={
              isSubmitting ||
              availableClients.length === 0 ||
              availableVehicles.length === 0 ||
              availableDrivers.length === 0
            }
          >
            {isSubmitting
              ? "Calculating route..."
              : "Create order"}
          </button>
        </div>
      </form>
    </Modal>
  );
};