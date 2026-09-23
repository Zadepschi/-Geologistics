import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import {
  deleteClient,
  fetchClients,
} from "@/shared/api/clients";
import type { Order } from "@/entities/order";
import { fetchOrders } from "@/shared/api/orders";
import { ClientDeleteModal } from "@/pages/clients/ui/ClientDeleteModal";
import styles from "./ClientsList.module.scss";

interface ClientsListProps {
  onEdit: (client: Client) => void;
}

export const ClientsList = ({
  onEdit,
}: ClientsListProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientToDelete, setClientToDelete] =
    useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch((error) => {
        console.error("Failed to load clients", error);
      });
  }, []);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error("Failed to load orders", error);
      });
  }, []);

  useEffect(() => {
    const handleClientsUpdated = () => {
      fetchClients()
        .then(setClients)
        .catch((error) => {
          console.error("Failed to reload clients", error);
        });
    };

    window.addEventListener(
      "clients-updated",
      handleClientsUpdated
    );

    return () => {
      window.removeEventListener(
        "clients-updated",
        handleClientsUpdated
      );
    };
  }, []);

  const handleDelete = async () => {
    if (!clientToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteClient(clientToDelete.id);

      setClients((current) =>
        current.filter(
          (item) => item.id !== clientToDelete.id
        )
      );

      setClientToDelete(null);
    } catch (error) {
      console.error("Failed to delete client", error);

      window.alert(
        "This client cannot be deleted because it is used by existing orders."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2>Clients</h2>
          <span>{clients.length}</span>
        </div>

        <div className={styles.list}>
          {clients.map((client) => {
            const clientOrders = orders.filter(
              (order) => order.clientId === client.id
            );

            const lastOrder = clientOrders.at(-1);

            return (
              <div
                key={client.id}
                className={styles.clientCard}
              >
                <div className={styles.main}>
                  <div>
                    <h3>{client.name}</h3>
                    <p>{client.email}</p>
                  </div>

                  <span className={styles.ordersCount}>
                    {clientOrders.length} orders
                  </span>
                </div>

                <div className={styles.info}>
                  <div>
                    <span>Phone</span>
                    <strong>{client.phone}</strong>
                  </div>

                  <div>
                    <span>Address</span>
                    <strong>{client.address}</strong>
                  </div>

                  <div>
                    <span>Last order</span>
                    <strong>
                      {lastOrder?.id ?? "No orders"}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      {lastOrder?.status ?? "—"}
                    </strong>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => onEdit(client)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() =>
                      setClientToDelete(client)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <ClientDeleteModal
        clientName={clientToDelete?.name ?? null}
        open={clientToDelete !== null}
        loading={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setClientToDelete(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  );
};