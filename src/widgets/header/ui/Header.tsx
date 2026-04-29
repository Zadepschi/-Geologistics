import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Header.module.scss";

type User = {
  id: number;
  name: string;
};

type Notification = {
  id: number;
  text: string;
  read: boolean;
};

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/delivery-tracking": "Delivery Tracking",
  "/dispatch": "Dispatch",
  "/fleet": "Fleet",
  "/drivers": "Drivers",
  "/clients": "Clients",
  "/settings": "Settings",
};

export const Header = () => {
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const title = pageTitles[location.pathname] ?? "Dashboard";

  useEffect(() => {
    const loadHeaderData = async () => {
      try {
        const [userRes, notifRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/notifications"),
        ]);

        if (!userRes.ok || !notifRes.ok) {
          throw new Error("Failed to load data");
        }

        const userData = await userRes.json();
        const notifData = await notifRes.json();

        setUser(userData);
        setNotifications(notifData);
      } catch (error) {
        console.error("Header error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHeaderData();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.header}>
      <div className={styles.title}>{title}</div>

      <div className={styles.actions}>
        <button className={styles.icon}>⌕</button>

        <button className={styles.icon}>
          🔔
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </button>

        <div className={styles.user}>
          {loading ? "Loading..." : user?.name ?? "Unknown User"}
        </div>
      </div>
    </div>
  );
};