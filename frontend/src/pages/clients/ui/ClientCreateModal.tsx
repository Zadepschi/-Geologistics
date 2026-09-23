import { useState } from "react";
import { Modal } from "@/shared/ui/modal/Modal";
import { createClient } from "@/shared/api/clients";
import styles from "./ClientCreateModal.module.scss";

interface ClientCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const ClientCreateModal = ({
  open,
  onClose,
  onCreated,
}: ClientCreateModalProps) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

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

    try {
      await createClient(form);

      onCreated();

      setForm({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      onClose();
    } catch (error) {
      console.error("Failed to create client", error);
    }
  };

  return (
    <Modal
      open={open}
      title="Create client"
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
          <span>Address</span>
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            placeholder="Client address"
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
            Create client
          </button>
        </div>
      </form>
    </Modal>
  );
};