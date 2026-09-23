import { Modal } from "@/shared/ui/modal/Modal";
import styles from "./VehicleDeleteModal.module.scss";

interface VehicleDeleteModalProps {
  vehicleName: string | null;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const VehicleDeleteModal = ({
  vehicleName,
  open,
  loading,
  onClose,
  onConfirm,
}: VehicleDeleteModalProps) => {
  return (
    <Modal
      open={open}
      title="Delete vehicle"
      onClose={onClose}
    >
      <div className={styles.content}>
        <p>
          Are you sure you want to delete{" "}
          <strong>{vehicleName}</strong>?
        </p>

        <p className={styles.warning}>
          This action cannot be undone.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className={styles.deleteButton}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete vehicle"}
          </button>
        </div>
      </div>
    </Modal>
  );
};