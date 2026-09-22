import {
  LayoutDashboard,
  Truck,
  Send,
  Bus,
  Users,
  Building2,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    title: "Main",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
      },
      {
        label: "Delivery Tracking",
        path: "/delivery-tracking",
        icon: Truck,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Dispatch",
        path: "/dispatch",
        icon: Send,
      },
      {
        label: "Fleet",
        path: "/fleet",
        icon: Bus,
      },
      {
        label: "Drivers",
        path: "/drivers",
        icon: Users,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Clients",
        path: "/clients",
        icon: Building2,
      },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
] as const;