import { Bike, Truck, Car } from "lucide-react";
import type { VehicleType } from "../model/types";

interface VehicleTypeIconProps {
  type: VehicleType;
  size?: number;
}

export const VehicleTypeIcon = ({
  type,
  size = 18,
}: VehicleTypeIconProps) => {
  switch (type) {
    case "truck":
      return <Truck size={size} />;
    case "van":
      return <Car size={size} />;
    case "bike":
      return <Bike size={size} />;
    default:
      return <Car size={size} />;
  }
};