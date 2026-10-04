import { Modal } from "@/shared/ui/modal/Modal";
import styles from "./DriverDeleteModal.module.scss";

interface DriverDeleteModalProps {
  driverName: string | null;
  isArchived?: boolean;
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DriverDeleteModal = ({
  driverName,
  isArchived = false,
  open,
  loading = false,
  error,
  onClose,
  onConfirm,
}: DriverDeleteModalProps) => {
  if (!open || !driverName) {
    return null;
  }

  const action = isArchived
    ? "restore"
    : "archive";

  return (
    <Modal
      open={open}
      title={
        isArchived
          ? "Restore driver?"
          : "Archive driver?"
      }
      onClose={onClose}
      maxWidth={420}
    >
      <div className={styles.content}>
        <div className={styles.icon}>!</div>

        <p>
          Are you sure you want to{" "}
          {action}{" "}
          <strong>{driverName}</strong>?
        </p>

        {!error && (
          <span className={styles.warning}>
            {isArchived
              ? "This driver will become available again."
              : "The driver will be kept in history and can be restored later."}
          </span>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </div>

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
              ? "Restore driver"
              : "Archive driver"}
        </button>
      </div>
    </Modal>
  );
};