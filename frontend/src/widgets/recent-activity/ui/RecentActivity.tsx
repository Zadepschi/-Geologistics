import { Card } from "@/shared/ui/card/Card";
import styles from "./RecentActivity.module.scss";

const activities = [
  {
    id: 1,
    title: "Delivery completed",
    description: "Truck #101 completed a delivery in Brooklyn",
    time: "10 min ago",
  },
  {
    id: 2,
    title: "Delivery started",
    description: "Truck #102 started a delivery to Manhattan",
    time: "25 min ago",
  },
  {
    id: 3,
    title: "Vehicle assigned",
    description: "Truck #103 was assigned to a new order in Queens",
    time: "1 hour ago",
  },
];

export const RecentActivity = () => {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Recent Activity</h2>
      </div>

      <div className={styles.list}>
        {activities.map((activity) => (
          <div key={activity.id} className={styles.item}>
            <div className={styles.dot} />

            <div className={styles.content}>
              <div className={styles.top}>
                <h3>{activity.title}</h3>
                <span>{activity.time}</span>
              </div>

              <p>{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};