import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/app/layouts/AppLayout";

import { DashboardPage } from "@/pages/dashboard";
import { DeliveryTrackingPage } from "@/pages/delivery-tracking";
import { DispatchPage } from "@/pages/dispatch";
import { FleetPage } from "@/pages/fleet";
import { DriversPage } from "@/pages/drivers";
import { ClientsPage } from "@/pages/clients";
import { SettingsPage } from "@/pages/settings";

import { routes } from "@/shared/config/routes";

export const AppRouter = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={routes.dashboard} element={<DashboardPage />} />
        <Route
          path={routes.deliveryTracking}
          element={<DeliveryTrackingPage />}
        />
        <Route path={routes.dispatch} element={<DispatchPage />} />
        <Route path={routes.fleet} element={<FleetPage />} />
        <Route path={routes.drivers} element={<DriversPage />} />
        <Route path={routes.clients} element={<ClientsPage />} />
        <Route path={routes.settings} element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};