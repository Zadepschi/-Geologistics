import { useState } from "react";
import type { Client } from "@/entities/client";
import { ClientsList } from "@/widgets/clients-list";
import { ClientCreateModal } from "./ClientCreateModal";
import { ClientEditModal } from "./ClientEditModal";
import styles from "./ClientsPage.module.scss";

export const ClientsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);

  const handleClientCreated = () => {
    window.dispatchEvent(new Event("clients-updated"));
  };

  const handleClientUpdated = () => {
    window.dispatchEvent(new Event("clients-updated"));
    setSelectedClient(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Manage clients and review their delivery activity.
        </p>

        <button
          type="button"
          className={styles.addButton}
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Add client
        </button>
      </div>

      <div className={styles.content}>
        <ClientsList
          onEdit={setSelectedClient}
        />

        <ClientCreateModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleClientCreated}
        />

        <ClientEditModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={handleClientUpdated}
        />
      </div>
    </div>
  );
};