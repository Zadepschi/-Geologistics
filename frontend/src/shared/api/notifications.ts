export type Notification = {
  id: number;
  text: string;
  read: boolean;
};

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");

  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return res.json();
}

export async function markNotificationAsRead(
  id: number
): Promise<Notification> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });

  if (!res.ok) {
    throw new Error("Failed to mark notification as read");
  }

  return res.json();
}