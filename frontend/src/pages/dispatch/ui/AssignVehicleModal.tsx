import { Modal } from "@/shared/ui/modal/Modal";
import styles from "./AssignVehicleModal.module.scss";

interface VehicleOption {
  id: string;
  code: string;
  name: string;
}

interface DriverOption {
  id: string;
  name: string;
}

interface AssignVehicleModalProps {
  open: boolean;
  orderId: string;
  vehicles: VehicleOption[];
  drivers: DriverOption[];
  selectedVehicleId: string;
  selectedDriverId: string;
  isAssigning: boolean;
  error: string;
  onVehicleChange: (vehicleId: string) => void;
  onDriverChange: (driverId: string) => void;
  onClose: () => void;
  onAssign: () => void;
}

export const AssignVehicleModal = ({
  open,
  orderId,
  vehicles,
  drivers,
  selectedVehicleId,
  selectedDriverId,
  isAssigning,
  error,
  onVehicleChange,
  onDriverChange,
  onClose,
  onAssign,
}: AssignVehicleModalProps) => {
  return (
    <Modal
      open={open}
      title="Assign vehicle and driver"
      onClose={onClose}
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onAssign();
        }}
      >
        <div className={styles.order}>
          Order {orderId}
        </div>

        <label className={styles.field}>
          <span>Available vehicle</span>

          <select
            value={selectedVehicleId}
            onChange={(event) =>
              onVehicleChange(event.target.value)
            }
            disabled={isAssigning}
            required
          >
            <option value="">Select vehicle</option>

            {vehicles.map((vehicle) => (
              <option
                key={vehicle.id}
                value={vehicle.id}
              >
                {vehicle.name} ({vehicle.code})
              </option>
            ))}
          </select>
        </label>

        {vehicles.length === 0 && (
          <p className={styles.hint}>
            No idle vehicles are currently available.
          </p>
        )}

        <label className={styles.field}>
          <span>Available driver</span>

          <select
            value={selectedDriverId}
            onChange={(event) =>
              onDriverChange(event.target.value)
            }
            disabled={isAssigning}
            required
          >
            <option value="">Select driver</option>

            {drivers.map((driver) => (
              <option
                key={driver.id}
                value={driver.id}
              >
                {driver.name}
              </option>
            ))}
          </select>
        </label>

        {drivers.length === 0 && (
          <p className={styles.hint}>
            No available drivers were found.
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
            onClick={onClose}
            disabled={isAssigning}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isAssigning ||
              !selectedVehicleId ||
              !selectedDriverId
            }
          >
            {isAssigning
              ? "Assigning..."
              : "Assign vehicle and driver"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
