export type DriverStatus = "available" | "on-duty" | "off-duty";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  vehicleId?: string;
}