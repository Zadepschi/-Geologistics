import { Card } from "@/shared/ui/card/Card";
import { driversMock } from "@/entities/driver";
import { useFleetStore } from "@/shared/store/fleet";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import styles from "./DriversList.module.scss";

export const DriversList = () => {
  useLoadVehicles();

  const vehicles = useFleetStore((s) => s.vehicles);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Drivers</h2>
        <span>{driversMock.length}</span>
      </div>

      <div className={styles.list}>
        {driversMock.map((driver) => {
          const assignedVehicle = vehicles.find(
            (vehicle) => vehicle.id === driver.vehicleId
          );

          return (
            <div key={driver.id} className={styles.driverCard}>
              <div className={styles.main}>
                <div>
                  <h3>{driver.name}</h3>
                  <p>{driver.phone}</p>
                </div>

                <span className={styles.status}>{driver.status}</span>
              </div>

              <div className={styles.info}>
                <div>
                  <span>Vehicle</span>
                  <strong>{assignedVehicle?.name ?? "Not assigned"}</strong>
                </div>

                <div>
                  <span>Vehicle status</span>
                  <strong>{assignedVehicle?.status ?? "—"}</strong>
                </div>

                <div>
                  <span>Speed</span>
                  <strong>
                    {assignedVehicle?.telemetry.speedKmH ?? 0} km/h
                  </strong>
                </div>

                <div>
                  <span>Route</span>
                  <strong>
                    {assignedVehicle?.route ? "Active route" : "No route"}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};