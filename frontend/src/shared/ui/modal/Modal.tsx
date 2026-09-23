import type { ReactNode } from "react";
import styles from "./Modal.module.scss";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: number;
}

export const Modal = ({
  open,
  title,
  children,
  onClose,
  maxWidth = 520,
}: ModalProps) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={onClose}
    >
      <div
        className={styles.modal}
        style={{ maxWidth }}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className={styles.header}>
          <h2>{title}</h2>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};