import { useEffect, useState } from "react";
import { Card } from "@/shared/ui/card/Card";
import styles from "./RecentActivity.module.scss";

type Activity = {
  id: number;
  type: string;
  title: string;
  description: string;
  orderId: string | null;
  vehicleId: string | null;
  createdAt: string;
};

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/activities");

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const data: Activity[] = await response.json();
        setActivities(data);
        setError(false);
      } catch (err) {
        console.error("Failed to load activities:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchActivities();
  }, []);

  const formatTime = (date: string) => {
    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
    }).format(
      Math.round(
        (new Date(date).getTime() - Date.now()) / 60000,
      ),
      "minute",
    );
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Recent Activity</h2>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p>Loading activity...</p>
        ) : error ? (
          <p>Failed to load activity.</p>
        ) : activities.length === 0 ? (
          <p>No recent activity yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className={styles.item}>
              <div className={styles.dot} />

              <div className={styles.content}>
                <div className={styles.top}>
                  <h3>{activity.title}</h3>
                  <span>{formatTime(activity.createdAt)}</span>
                </div>

                <p>{activity.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};