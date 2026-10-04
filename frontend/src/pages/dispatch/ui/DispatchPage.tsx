import { useState } from "react";
import type { Order } from "@/entities/order";
import type { Client } from "@/entities/client";
import type { Driver } from "@/entities/driver";
import { fetchClients } from "@/shared/api/clients";
import { fetchDrivers } from "@/shared/api/drivers";
import { useFleetStore } from "@/shared/store/fleet";
import { DispatchOrders } from "@/widgets/dispatch-orders";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { CreateOrderModal } from "./CreateOrderModal";
import { EditOrderModal } from "./EditOrderModal";
import styles from "./DispatchPage.module.scss";

export const DispatchPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [clients, setClients] = useState<Client[]>([]);

  const [drivers, setDrivers] = useState<Driver[]>([]);

  const vehicles = useFleetStore((state) => state.vehicles);

  useLoadVehicles();

  const handleOpenCreateOrder = async () => {
    try {
      const [
        loadedClients,
        loadedDrivers,
      ] = await Promise.all([
        fetchClients(),
        fetchDrivers(),
      ]);

      setClients(loadedClients);
      setDrivers(loadedDrivers);
      setIsCreateModalOpen(true);
    } catch (error) {
      console.error(
        "Failed to load order form data",
        error
      );
    }
  };

  const handleOpenEditOrder = async (order: Order) => {
    try {
      const loadedClients = await fetchClients();

      setClients(loadedClients);
      setSelectedOrder(order);
    } catch (error) {
      console.error(
        "Failed to load clients",
        error
      );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Assign vehicles and manage delivery operations.
        </p>

        <button
          type="button"
          className={styles.addButton}
          onClick={handleOpenCreateOrder}
        >
          + Create order
        </button>
      </div>

      <div className={styles.content}>
        <DispatchOrders
          onEditOrder={handleOpenEditOrder}
        />
      </div>

      <CreateOrderModal
        open={isCreateModalOpen}
        clients={clients}
        vehicles={vehicles}
        drivers={drivers}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        onCreated={() => {
          window.location.reload();
        }}
      />

      <EditOrderModal
        open={!!selectedOrder}
        order={selectedOrder}
        clients={clients}
        onClose={() =>
          setSelectedOrder(null)
        }
        onUpdated={() => {
          setSelectedOrder(null);
          window.location.reload();
        }}
      />
    </div>
  );
};