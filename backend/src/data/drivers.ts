export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: "available" | "on-duty" | "off-duty";
  vehicleId?: string;
}

export const drivers: Driver[] = [
  {
    id: "driver-101",
    name: "D. Miller",
    phone: "+1 555 0101",
    status: "on-duty",
    vehicleId: "vehicle-101",
  },
  {
    id: "driver-305",
    name: "S. Wilson",
    phone: "+1 555 0305",
    status: "available",
    vehicleId: "vehicle-305",
  },
  {
    id: "driver-403",
    name: "L. Martinez",
    phone: "+1 555 0403",
    status: "on-duty",
    vehicleId: "vehicle-403",
  },
];