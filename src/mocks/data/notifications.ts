export interface Notification {
  id: number;
  text: string;
  read: boolean;
}

export const notifications: Notification[] = [
  { id: 1, text: "Shipment created", read: false },
  { id: 2, text: "Truck arrived", read: true },
];