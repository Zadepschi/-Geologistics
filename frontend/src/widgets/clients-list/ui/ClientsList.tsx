import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Client } from "@/entities/client";
import {
  archiveClient,
  fetchClients,
} from "@/shared/api/clients";
import type { Order } from "@/entities/order";
import { fetchOrders } from "@/shared/api/orders";
import { ClientDeleteModal } from "@/pages/clients/ui/ClientDeleteModal";
import styles from "./ClientsList.module.scss";

interface ClientsListProps {
  onEdit: (client: Client) => void;
}

type ClientView = "completed" | "in-progress" |  "archived" ;

export const ClientsList = ({
  onEdit,
}: ClientsListProps) => {
  const [clients, setClients] =
    useState<Client[]>([]);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [search, setSearch] =
    useState("");

 const [view, setView] =
  useState<ClientView>("in-progress");

  const [clientToArchive, setClientToArchive] =
    useState<Client | null>(null);

  const [isArchiving, setIsArchiving] =
    useState(false);

  const [archiveError, setArchiveError] =
    useState("");

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch((error) => {
        console.error(
          "Failed to load clients",
          error
        );
      });
  }, []);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error(
          "Failed to load orders",
          error
        );
      });
  }, []);

  useEffect(() => {
    const handleClientsUpdated = () => {
      fetchClients()
        .then(setClients)
        .catch((error) => {
          console.error(
            "Failed to reload clients",
            error
          );
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


const normalizedSearch = search.trim().toLowerCase();

const activeStatuses = [
  "assigned",
  "in-progress",
  "delayed",
];

const filteredClients = clients.filter((client) => {
  if (view === "archived") {
    if (!client.isArchived) return false;
  } else {
    if (client.isArchived) return false;

    const clientOrders = orders.filter(
      (order) => order.clientId === client.id
    );

    if (clientOrders.length === 0) return false;

    const hasActiveOrder = clientOrders.some((order) =>
      activeStatuses.includes(order.status)
    );

    const allOrdersCompleted = clientOrders.every(
      (order) => order.status === "completed"
    );

    if (view === "in-progress" && !hasActiveOrder) {
      return false;
    }

    if (view === "completed" && !allOrdersCompleted) {
      return false;
    }
  }

  if (!normalizedSearch) return true;

  return [
    client.name,
    client.email,
    client.phone,
    client.address,
  ].some((value) =>
    (value ?? "").toLowerCase().includes(normalizedSearch)
  );
});




const archivedCount = clients.filter(
  (client) => client.isArchived
).length;

const inProgressCount = clients.filter((client) => {
  if (client.isArchived) return false;

  return orders.some(
    (order) =>
      order.clientId === client.id &&
      activeStatuses.includes(order.status)
  );
}).length;

const completedCount = clients.filter((client) => {
  if (client.isArchived) return false;

  const clientOrders = orders.filter(
    (order) => order.clientId === client.id
  );

  return (
    clientOrders.length > 0 &&
    clientOrders.every(
      (order) => order.status === "completed"
    )
  );
}).length;




  const handleArchive = async () => {
    if (!clientToArchive) {
      return;
    }

    setIsArchiving(true);
    setArchiveError("");

    try {
      const updatedClient =
        await archiveClient(
          clientToArchive.id,
          !clientToArchive.isArchived
        );

      setClients((current) =>
        current.map((client) =>
          client.id === updatedClient.id
            ? updatedClient
            : client
        )
      );

      setClientToArchive(null);
    } catch (error) {
      console.error(
        "Failed to archive client",
        error
      );

      setArchiveError(
        clientToArchive.isArchived
          ? "Failed to restore this client."
          : "Failed to archive this client."
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveClick = (
    client: Client
  ) => {
    setArchiveError("");
    setClientToArchive(client);
  };

  

  return (
    <>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2>Clients</h2>

          
<div className={styles.tabs}>
 

  <button
    type="button"
    onClick={() => setView("in-progress")}
    className={
      view === "in-progress"
        ? styles.tabActive
        : styles.tab
    }
  >
    In Progress
    <span>{inProgressCount}</span>
  </button>

  <button
    type="button"
    onClick={() => setView("completed")}
    className={
      view === "completed"
        ? styles.tabActive
        : styles.tab
    }
  >
    Completed
    <span>{completedCount}</span>
  </button>


   <button
    type="button"
    onClick={() => setView("archived")}
    className={
      view === "archived"
        ? styles.tabActive
        : styles.tab
    }
  >
    Archived
    <span>{archivedCount}</span>
  </button>
</div>

        </div>

        <div className={styles.search}>
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, email, phone or address..."
            aria-label="Search clients"
          />
        </div>

        <div className={styles.list}>
          {filteredClients.map((client) => {
           
const clientOrders = orders.filter(
  (order) => order.clientId === client.id
);

const activeClientOrders = clientOrders.filter(
  (order) =>
    order.status === "assigned" ||
    order.status === "in-progress" ||
    order.status === "delayed"
);

const lastOrder =
  activeClientOrders.at(-1) ??
  clientOrders.at(-1);


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
  {activeClientOrders.length > 0 &&
    ` · ${activeClientOrders.length} active`}
</span>
                </div>

                <div className={styles.info}>
                  <div>
                    <span>Phone</span>

                    <strong>
                      {client.phone}
                    </strong>
                  </div>

                  <div>
                    <span>Address</span>

                    <strong>
                      {client.address}
                    </strong>
                  </div>

                  <div>
                    <span>Last order</span>

                    <strong>
                      {lastOrder?.id ??
                        "No orders"}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>
                      {lastOrder?.status ?? "—"}
                    </strong>
                  </div>
                </div>

                <div
                  className={styles.actions}
                >
                  {view !== "archived" && (
                    <button
                      type="button"
                      className={
                        styles.editButton
                      }
                      onClick={() =>
                        onEdit(client)
                      }
                    >
                      Edit
                    </button>
                  )}

                  <button
                    type="button"
                    className={
                      styles.deleteButton
                    }
                    onClick={() =>
                      handleArchiveClick(client)
                    }
                  >
                    {client.isArchived
                      ? "Restore"
                      : "Archive"}
                  </button>
                </div>

                {client.isArchived && (
                  <div>
                    Archived
                  </div>
                )}
              </div>
            );
          })}

          {filteredClients.length === 0 && (
  <div className={styles.empty}>
    {view === "archived"
      ? "No archived clients."
      : normalizedSearch
        ? "No clients found."
        : "No active clients available."}
  </div>
)}
        </div>
      </Card>

      <ClientDeleteModal
        clientName={
          clientToArchive?.name ?? null
        }
        isArchived={
          clientToArchive?.isArchived ?? false
        }
        open={clientToArchive !== null}
        loading={isArchiving}
        error={archiveError}
        onClose={() => {
          if (!isArchiving) {
            setClientToArchive(null);
            setArchiveError("");
          }
        }}
        onConfirm={handleArchive}
      />
    </>
  );
};