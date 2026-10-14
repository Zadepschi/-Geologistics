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

const PAGE_SIZE = 8;

export const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/activities");

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const data: Activity[] = await response.json();

        if (isMounted) {
          setActivities(data);
          setError(false);
        }
      } catch (err) {
        console.error("Failed to load activities:", err);

        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatTime = (date: string) => {
    const minutes = Math.round(
      (new Date(date).getTime() - Date.now()) / 60000
    );

    return new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
    }).format(minutes, "minute");
  };

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = visibleCount < activities.length;

  const handleLoadMore = () => {
    setVisibleCount((count) =>
      Math.min(count + PAGE_SIZE, activities.length)
    );
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h2>Recent Activity</h2>
        {!loading && !error && (
          <span className={styles.count}>
            {activities.length}
          </span>
        )}
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.message}>Loading activity...</p>
        ) : error ? (
          <p className={styles.message}>
            Failed to load activity.
          </p>
        ) : activities.length === 0 ? (
          <p className={styles.message}>
            No recent activity yet.
          </p>
        ) : (
          visibleActivities.map((activity) => (
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

      {!loading && !error && hasMore && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.loadMore}
            onClick={handleLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </Card>
  );
};