import { Modal } from "@/shared/ui/modal/Modal";
import styles from "./ClientDeleteModal.module.scss";

interface ClientDeleteModalProps {
  clientName: string | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClientDeleteModal = ({
  clientName,
  open,
  loading = false,
  onClose,
  onConfirm,
}: ClientDeleteModalProps) => {
  if (!open || !clientName) {
    return null;
  }

  return (
    <Modal
      open={open}
      title="Delete client?"
      onClose={onClose}
      maxWidth={420}
    >
      <div className={styles.content}>
        <div className={styles.icon}>!</div>

        <p>
          Are you sure you want to delete{" "}
          <strong>{clientName}</strong>?
        </p>

        <span className={styles.warning}>
          This action cannot be undone.
        </span>
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
          {loading ? "Deleting..." : "Delete client"}
        </button>
      </div>
    </Modal>
  );
};