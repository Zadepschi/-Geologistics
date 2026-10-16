import { Sidebar } from "@/widgets/sidebar";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.scss";

export const AppLayout = () => {
  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.main}>
        <Header />

        <main className={styles.content}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};