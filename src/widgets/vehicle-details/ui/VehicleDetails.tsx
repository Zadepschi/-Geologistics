import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import { ordersMock } from "@/entities/order/model/mock";
import styles from "./VehicleDetails.module.scss";

export const VehicleDetails = () => {
  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore((s) => s.selectedVehicleId);

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;

  const selectedOrder = selectedVehicle
    ? ordersMock.find((order) => order.vehicleId === selectedVehicle.id) ?? null
    : null;

  return (
    <Card className={styles.detailsCard}>
      <h2>Vehicle details</h2>

      {selectedVehicle ? (
        <div className={styles.details}>
          <div>
            <span>Vehicle</span>
            <strong>{selectedVehicle.name}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{selectedVehicle.status}</strong>
          </div>

          <div>
            <span>Driver</span>
            <strong>{selectedVehicle.driverName ?? "No driver"}</strong>
          </div>

          <div>
            <span>Speed</span>
            <strong>{selectedVehicle.telemetry.speedKmH ?? 0} km/h</strong>
          </div>

          <div>
            <span>Order</span>
            <strong>{selectedOrder?.id ?? "No active order"}</strong>
          </div>

          <div>
            <span>Client</span>
            <strong>{selectedOrder?.clientName ?? "—"}</strong>
          </div>

          <div>
            <span>Address</span>
            <strong>{selectedOrder?.address ?? "—"}</strong>
          </div>

          <div>
            <span>ETA</span>
            <strong>
              {selectedVehicle.route?.etaMinutes
                ? `${selectedVehicle.route.etaMinutes} min`
                : selectedOrder?.eta ?? "—"}
            </strong>
          </div>

          <div>
            <span>Stops left</span>
            <strong>{selectedVehicle.route?.stopsLeft ?? "—"}</strong>
          </div>

          <div>
            <span>Delivery</span>
            <strong>
              {selectedVehicle.route?.deliveryCompleted
                ? "Completed"
                : "In progress"}
            </strong>
          </div>
        </div>
      ) : (
        <p className={styles.empty}>Select a vehicle to see details.</p>
      )}
    </Card>
  );
};