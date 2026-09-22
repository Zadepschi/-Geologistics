import { AppRouter } from "./providers/router/ui/AppRouter";
import { useLiveTracking } from "@/features/live-tracking/model/useLiveTracking";

export const App = () => {
  useLiveTracking();

  return <AppRouter />;
};