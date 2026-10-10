
import {
  Truck,
  Package,
  Clock3,
  Gauge,
  type LucideIcon,
} from "lucide-react";

import { useEffect, useState } from "react";

import type { Order } from "@/entities/order";
import { fetchOrders } from "@/shared/api/orders";
import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";

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
  const vehicles = useFleetStore((state) => state.vehicles);

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetchOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load orders", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalOrders = orders.length;

  const completedOrders = orders.filter(
    (order) => order.status === "completed",
  ).length;

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "assigned" ||
      order.status === "in-progress" ||
      order.status === "delayed",
  ).length;

  const performance =
    totalOrders > 0
      ? Math.round((completedOrders / totalOrders) * 100)
      : 0;

  const kpis: KpiItem[] = [
    {
      title: "Vehicles",
      value: String(vehicles.length),
      change: "Total fleet",
      tone: "green",
    },
    {
      title: "Orders",
      value: String(totalOrders),
      change: "All orders",
      tone: "purple",
    },
    {
      title: "Pending",
      value: String(pendingOrders),
      change: "Active workload",
      tone: "yellow",
    },
    {
      title: "Performance",
      value: `${performance}%`,
      change: `${completedOrders} completed`,
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
              className={[
                styles.iconWrap,
                styles[`${item.tone}Icon`],
              ].join(" ")}
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
              </div>

              <div className={styles.change}>
                {item.change}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
