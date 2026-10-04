import { Modal } from "@/shared/ui/modal/Modal";
import styles from "./AssignVehicleModal.module.scss";

interface VehicleOption {
  id: string;
  code: string;
  name: string;
}

interface AssignVehicleModalProps {
  open: boolean;
  orderId: string;
  vehicles: VehicleOption[];
  selectedVehicleId: string;
  isAssigning: boolean;
  error: string;
  onVehicleChange: (vehicleId: string) => void;
  onClose: () => void;
  onAssign: () => void;
}

export const AssignVehicleModal = ({
  open,
  orderId,
  vehicles,
  selectedVehicleId,
  isAssigning,
  error,
  onVehicleChange,
  onClose,
  onAssign,
}: AssignVehicleModalProps) => {
  return (
    <Modal
      open={open}
      title="Assign vehicle"
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
          >
            <option value="">
              Select vehicle
            </option>

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
              isAssigning || !selectedVehicleId
            }
          >
            {isAssigning
              ? "Assigning..."
              : "Assign vehicle"}
          </button>
        </div>
      </form>
    </Modal>
  );
};