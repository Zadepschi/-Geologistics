import { Card } from "@/shared/ui/card/Card";

import { useEffect, useState } from "react";

import type { Driver } from "@/entities/driver";

import {
  archiveDriver,
  fetchDrivers,
} from "@/shared/api/drivers";

import type { Order } from "@/entities/order";

import { fetchOrders } from "@/shared/api/orders";

import { useFleetStore } from "@/shared/store/fleet";

import styles from "./DriversList.module.scss";

import { DriverDeleteModal } from "@/pages/drivers/ui/DriverDeleteModal";

const getRouteStatus = (
  deliveryCompleted?: boolean,
  hasRoute?: boolean
) => {
  if (!hasRoute) {
    return "No route";
  }

  if (deliveryCompleted) {
    return "Completed";
  }

  return "Active route";
};

const getDriverDisplayStatus = (
  driver: Driver,
  activeOrder: Order | undefined
) => {
  if (activeOrder?.status === "in-progress") {
    return "on-route";
  }

  if (activeOrder?.status === "delayed") {
    return "delayed";
  }

  if (activeOrder?.status === "assigned") {
    return "on-duty";
  }

  return driver.status;
};

interface DriversListProps {
  onEdit: (driver: Driver) => void;
}

type DriverView = "active" | "archived";

export const DriversList = ({
  onEdit,
}: DriversListProps) => {
  const vehicles = useFleetStore(
    (state) => state.vehicles
  );

  const [drivers, setDrivers] = useState<Driver[]>(
    []
  );

  const [orders, setOrders] = useState<Order[]>(
    []
  );

  const [search, setSearch] = useState("");

  const [view, setView] =
    useState<DriverView>("active");

  const [driverToArchive, setDriverToArchive] =
    useState<Driver | null>(null);

  const [isArchiving, setIsArchiving] =
    useState(false);

  const [archiveError, setArchiveError] =
    useState("");

  useEffect(() => {
    fetchDrivers()
      .then(setDrivers)
      .catch((error) => {
        console.error(
          "Failed to load drivers",
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

  const filteredDrivers = drivers.filter((driver) => {
    if (
      view === "active" &&
      driver.isArchived
    ) {
      return false;
    }

    if (
      view === "archived" &&
      !driver.isArchived
    ) {
      return false;
    }

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      driver.name
        .toLowerCase()
        .includes(query) ||
      driver.phone
        .toLowerCase()
        .includes(query)
    );
  });

  const activeCount = drivers.filter(
    (driver) => !driver.isArchived
  ).length;

  const archivedCount = drivers.filter(
    (driver) => driver.isArchived
  ).length;

  const handleArchive = async () => {
    if (!driverToArchive) {
      return;
    }

    setIsArchiving(true);
    setArchiveError("");

    try {
      const updatedDriver =
        await archiveDriver(
          driverToArchive.id,
          !driverToArchive.isArchived
        );

      setDrivers((current) =>
        current.map((driver) =>
          driver.id === updatedDriver.id
            ? updatedDriver
            : driver
        )
      );

      setDriverToArchive(null);
    } catch (error) {
      console.error(
        "Failed to archive driver",
        error
      );

      setArchiveError(
        driverToArchive.isArchived
          ? "Failed to restore this driver."
          : "Failed to archive this driver."
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveClick = (
    driver: Driver
  ) => {
    setArchiveError("");
    setDriverToArchive(driver);
  };

  return (
    <>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2>Drivers</h2>

          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => setView("active")}
              className={
                view === "active"
                  ? styles.tabActive
                  : styles.tab
              }
            >
              Active
              <span>{activeCount}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setView("archived")
              }
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
            placeholder="Search by name or phone..."
            aria-label="Search drivers"
          />
        </div>

        <div className={styles.list}>
          {filteredDrivers.map((driver) => {
            const activeOrder = orders.find(
              (order) =>
                order.driverId === driver.id &&
                (
                  order.status === "assigned" ||
                  order.status === "in-progress" ||
                  order.status === "delayed"
                )
            );

            const orderVehicle = activeOrder
              ? vehicles.find(
                  (vehicle) =>
                    vehicle.id ===
                    activeOrder.vehicleId
                )
              : undefined;

            const assignedVehicle =
              orderVehicle;

            const routeStatus =
              getRouteStatus(
                assignedVehicle?.route
                  ?.deliveryCompleted,
                Boolean(
                  assignedVehicle?.route
                )
              );

            const driverDisplayStatus =
              getDriverDisplayStatus(
                driver,
                activeOrder
              );

            return (
              <div
                key={driver.id}
                className={
                  styles.driverCard
                }
              >
                <div className={styles.main}>
                  <div>
                    <h3>{driver.name}</h3>
                    <p>{driver.phone}</p>
                  </div>

                  <span
                    className={
                      styles.status
                    }
                  >
                    {driverDisplayStatus}
                  </span>
                </div>

                <div className={styles.info}>
                  <div>
                    <span>Vehicle</span>

                    <strong>
                      {assignedVehicle?.name ??
                        "Not assigned"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Vehicle status
                    </span>

                    <strong>
                      {assignedVehicle?.status ??
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Speed</span>

                    <strong>
                      {assignedVehicle
                        ?.telemetry
                        .speedKmH ?? 0}{" "}
                      km/h
                    </strong>
                  </div>

                  <div>
                    <span>Route</span>

                    <strong>
                      {routeStatus}
                    </strong>
                  </div>
                </div>

                <div
                  className={styles.actions}
                >
                  {view === "active" && (
                    <button
                      type="button"
                      className={
                        styles.editButton
                      }
                      onClick={() =>
                        onEdit(driver)
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
                      handleArchiveClick(
                        driver
                      )
                    }
                  >
                    {driver.isArchived
                      ? "Restore"
                      : "Archive"}
                  </button>
                </div>

                {driver.isArchived && (
                  <div>
                    Archived
                  </div>
                )}
              </div>
            );
          })}

          {filteredDrivers.length === 0 && (
            <div className={styles.empty}>
              {view === "archived"
                ? "No archived drivers."
                : "No active drivers found."}
            </div>
          )}
        </div>
      </Card>

      <DriverDeleteModal
        driverName={
          driverToArchive?.name ?? null
        }
        isArchived={
          driverToArchive?.isArchived ?? false
        }
        open={
          driverToArchive !== null
        }
        loading={isArchiving}
        error={archiveError}
        onClose={() => {
          if (!isArchiving) {
            setDriverToArchive(null);
            setArchiveError("");
          }
        }}
        onConfirm={handleArchive}
      />
    </>
  );
};