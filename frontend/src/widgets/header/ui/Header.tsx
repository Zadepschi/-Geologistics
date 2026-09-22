import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  fetchUser,
  type User,
} from "@/shared/api/user";
import {
  fetchNotifications,
  markNotificationAsRead,
  type Notification,
} from "@/shared/api/notifications";

import styles from "./Header.module.scss";

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[location.pathname] ?? "Dashboard";

  useEffect(() => {
    const loadHeaderData = async () => {
      try {
        const [userData, notifData] = await Promise.all([
          fetchUser(),
          fetchNotifications(),
        ]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location.pathname]);

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (notification.read) {
      return;
    }

    try {
      const updatedNotification =
        await markNotificationAsRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === updatedNotification.id
            ? updatedNotification
            : item
        )
      );
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div className={styles.header}>
      <div className={styles.title}>{title}</div>

      <div className={styles.actions}>
        <div
          ref={notificationsRef}
          className={styles.notifications}
        >
          <button
            type="button"
            className={styles.icon}
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            🔔

            {unreadCount > 0 && (
              <span className={styles.badge}>
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className={styles.notificationsDropdown}>
              <div className={styles.notificationsHeader}>
                <strong>Notifications</strong>
                <span>{unreadCount} unread</span>
              </div>

              <div className={styles.notificationsList}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`${styles.notification} ${
                        !notification.read ? styles.unread : ""
                      }`}
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                      role={
                        !notification.read ? "button" : undefined
                      }
                      tabIndex={
                        !notification.read ? 0 : undefined
                      }
                    >
                      <span className={styles.notificationDot} />

                      <div>
                        <div className={styles.notificationText}>
                          {notification.text}
                        </div>

                        <div className={styles.notificationStatus}>
                          {notification.read
                            ? "Read"
                            : "Unread"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyNotifications}>
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.user}>
          {loading ? "Loading..." : user?.name ?? "Unknown User"}
        </div>
      </div>
    </div>
  );
};