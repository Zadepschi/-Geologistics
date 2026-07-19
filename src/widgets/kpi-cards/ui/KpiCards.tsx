import {
  Truck,
  Package,
  Clock3,
  Gauge,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import { ordersMock } from "@/entities/order/model/mock";

import styles from "./KpiCards.module.scss";

type KpiTone = "green" | "purple" | "yellow" | "blue";

type KpiItem = {
  title: string;
  value: string;
  change: string;
  tone: KpiTone;
};

const toneIcons: Record<KpiTone, LucideIcon> = {
  green: Truck,
  purple: Package,
  yellow: Clock3,
  blue: Gauge,
};

export const KpiCards = () => {
  const vehicles = useFleetStore((s) => s.vehicles);

  const totalOrders = ordersMock.length;

  const isOrderCompleted = (
    orderVehicleId: string,
    orderStatus: string
  ) => {
    const vehicle = vehicles.find(
      (vehicle) => vehicle.id === orderVehicleId
    );

    return (
      orderStatus === "completed" ||
      vehicle?.route?.deliveryCompleted === true
    );
  };

  const pendingOrders = ordersMock.filter(
    (order) => !isOrderCompleted(order.vehicleId, order.status)
  ).length;

  const completedOrders = ordersMock.filter((order) =>
    isOrderCompleted(order.vehicleId, order.status)
  ).length;

  const performance =
    totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

  const kpis: KpiItem[] = [
    {
      title: "Vehicles",
      value: String(vehicles.length),
      change: "+4%",
      tone: "green",
    },
    {
      title: "Orders",
      value: String(totalOrders),
      change: "+12%",
      tone: "purple",
    },
    {
      title: "Pending",
      value: String(pendingOrders),
      change: "-2%",
      tone: "yellow",
    },
    {
      title: "Performance",
      value: `${performance}%`,
      change: "+6%",
      tone: "blue",
    },
  ];

  return (
    <div className={styles.grid}>
      {kpis.map((item) => {
        const Icon = toneIcons[item.tone];

        return (
          <Card
            key={item.title}
            className={`${styles.card} ${styles[item.tone]}`}
          >
            <div
              className={`${styles.iconWrap} ${
                styles[`${item.tone}Icon`]
              }`}
            >
              <Icon size={18} />
            </div>

            <div className={styles.content}>
              <div className={styles.title}>
                {item.title}
              </div>

              <div className={styles.row}>
                <div className={styles.value}>
                  {item.value}
                </div>

                {item.change ? (
                  <div className={styles.change}>
                    {item.change}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};