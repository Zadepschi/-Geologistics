import { Modal } from "@/shared/ui/modal/Modal";
import styles from "./VehicleDeleteModal.module.scss";

interface VehicleDeleteModalProps {
  vehicleName: string | null;
  isArchived?: boolean;
  open: boolean;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const VehicleDeleteModal = ({
  vehicleName,
  isArchived = false,
  open,
  loading,
  error,
  onClose,
  onConfirm,
}: VehicleDeleteModalProps) => {
  if (!open || !vehicleName) {
    return null;
  }

  return (
    <Modal
      open={open}
      title={
        isArchived
          ? "Restore vehicle?"
          : "Archive vehicle?"
      }
      onClose={onClose}
    >
      <div className={styles.content}>
        <p>
          Are you sure you want to{" "}
          {isArchived ? "restore" : "archive"}{" "}
          <strong>{vehicleName}</strong>?
        </p>

        {!error && (
          <p className={styles.warning}>
            {isArchived
              ? "This vehicle will become active again."
              : "The vehicle will be kept in history and can be restored later."}
          </p>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

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
            {loading
              ? "Saving..."
              : isArchived
                ? "Restore vehicle"
                : "Archive vehicle"}
          </button>
        </div>
      </div>
    </Modal>
  );
};