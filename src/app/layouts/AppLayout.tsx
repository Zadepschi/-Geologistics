import { Sidebar } from "@/widgets/sidebar";
import { Header } from "@/widgets/header";
import { Outlet } from "react-router-dom";

export const AppLayout = () => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Header />
        <Outlet /> 
      </div>
    </div>
  );
};