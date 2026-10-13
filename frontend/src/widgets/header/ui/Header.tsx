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

const INITIAL_VISIBLE_COUNT = 7;
const LOAD_MORE_COUNT = 7;

export const Header = () => {
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_VISIBLE_COUNT
  );

  const notificationsRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[location.pathname] ?? "Dashboard";

  useEffect(() => {
    let cancelled = false;

    const loadHeaderData = async () => {
      try {
        const [userData, notificationData] = await Promise.all([
          fetchUser(),
          fetchNotifications(),
        ]);

        if (cancelled) return;

        setUser(userData);
        setNotifications(notificationData);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load header data:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHeaderData();

    const intervalId = window.setInterval(() => {
      void fetchNotifications()
        .then((data) => {
          if (!cancelled) {
            setNotifications(data);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error(
              "Failed to refresh notifications:",
              error
            );
          }
        });
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
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
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    setNotificationsOpen(false);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [location.pathname]);

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (notification.read) return;

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
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const visibleNotifications = notifications.slice(
    0,
    visibleCount
  );

  const remainingCount = Math.max(
    0,
    notifications.length - visibleNotifications.length
  );

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
            onClick={() =>
              setNotificationsOpen((open) => {
                if (!open) {
                  setVisibleCount(INITIAL_VISIBLE_COUNT);
                }

                return !open;
              })
            }
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={notificationsOpen}
          >
            <span aria-hidden="true">🔔</span>

            {unreadCount > 0 && (
              <span className={styles.badge}>
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className={styles.notificationsDropdown}
              role="dialog"
              aria-label="Notifications"
            >
              <div className={styles.notificationsHeader}>
                <div className={styles.headerTitle}>
                  <strong>Notifications</strong>
                  <span className={styles.headerSubtitle}>
                    Stay up to date
                  </span>
                </div>

                <span
                  className={`${styles.unreadCount} ${
                    unreadCount === 0 ? styles.allRead : ""
                  }`}
                >
                  <span className={styles.countDot} />
                  {unreadCount} unread
                </span>
              </div>

              <div className={styles.notificationsList}>
                {notifications.length > 0 ? (
                  <>
                    {visibleNotifications.map((notification) => {
                      const isUnread = !notification.read;

                      return (
                        <div
                          key={notification.id}
                          className={`${styles.notification} ${
                            isUnread
                              ? styles.unread
                              : styles.read
                          }`}
                          onClick={() =>
                            void handleNotificationClick(
                              notification
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              isUnread &&
                              (event.key === "Enter" ||
                                event.key === " ")
                            ) {
                              event.preventDefault();

                              void handleNotificationClick(
                                notification
                              );
                            }
                          }}
                          role={isUnread ? "button" : undefined}
                          tabIndex={isUnread ? 0 : undefined}
                          aria-label={`${
                            isUnread ? "Unread" : "Read"
                          } notification: ${notification.text}`}
                        >
                          <div
                            className={
                              styles.notificationIndicator
                            }
                          >
                            <span
                              className={
                                styles.notificationDot
                              }
                            />
                          </div>

                          <div
                            className={
                              styles.notificationContent
                            }
                          >
                            <div
                              className={styles.notificationText}
                            >
                              {notification.text}
                            </div>

                            <div
                              className={
                                styles.notificationFooter
                              }
                            >
                              <span
                                className={`${
                                  styles.notificationStatus
                                } ${
                                  isUnread
                                    ? styles.unreadStatus
                                    : styles.readStatus
                                }`}
                              >
                                {isUnread ? "UNREAD" : "READ"}
                              </span>

                              {isUnread && (
                                <span
                                  className={styles.markReadHint}
                                >
                                  Click to mark as read
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {remainingCount > 0 && (
                      <button
                        type="button"
                        className={styles.loadMore}
                        onClick={() =>
                          setVisibleCount((count) =>
                            count + LOAD_MORE_COUNT
                          )
                        }
                      >
                        Load More
                        <span>
                          {remainingCount} remaining
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyNotifications}>
                    <span className={styles.emptyIcon}>✓</span>
                    <strong>You're all caught up</strong>
                    <span>No notifications to display.</span>
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