import { Card } from "@/shared/ui/card/Card";
import { useEffect, useState } from "react";
import type { Driver } from "@/entities/driver";
import { fetchDrivers } from "@/shared/api/drivers";
import { useFleetStore } from "@/shared/store/fleet";
import styles from "./DriversList.module.scss";

const getDriverStatus = (
  driver: Driver,
  vehicleStatus?: string
) => {
  if (vehicleStatus === "on-route") {
    return "on-duty";
  }

  if (vehicleStatus === "idle") {
    return "available";
  }

  return driver.status;
};

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

export const DriversList = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDrivers()
      .then(setDrivers)
      .catch((error) => {
        console.error("Failed to load drivers", error);
      });
  }, []);

  const filteredDrivers = drivers.filter((driver) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      driver.name.toLowerCase().includes(query) ||
      driver.phone.toLowerCase().includes(query)
    );
  });

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Drivers</h2>
        <span>{drivers.length}</span>
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
          const assignedVehicle = vehicles.find(
            (vehicle) => vehicle.id === driver.vehicleId
          );

          const displayedDriverStatus =
            getDriverStatus(
              driver,
              assignedVehicle?.status
            );

          const routeStatus = getRouteStatus(
            assignedVehicle?.route?.deliveryCompleted,
            Boolean(assignedVehicle?.route)
          );

          return (
            <div
              key={driver.id}
              className={styles.driverCard}
            >
              <div className={styles.main}>
                <div>
                  <h3>{driver.name}</h3>
                  <p>{driver.phone}</p>
                </div>

                <span className={styles.status}>
                  {displayedDriverStatus}
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
                  <span>Vehicle status</span>
                  <strong>
                    {assignedVehicle?.status ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>Speed</span>
                  <strong>
                    {assignedVehicle?.telemetry.speedKmH ??
                      0}{" "}
                    km/h
                  </strong>
                </div>

                <div>
                  <span>Route</span>
                  <strong>{routeStatus}</strong>
                </div>
              </div>
            </div>
          );
        })}

        {filteredDrivers.length === 0 && (
          <div className={styles.empty}>
            No drivers found.
          </div>
        )}
      </div>
    </Card>
  );
};