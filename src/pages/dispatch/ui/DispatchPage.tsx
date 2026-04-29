import { DispatchOrders } from "@/widgets/dispatch-orders";
import styles from "./DispatchPage.module.scss";

export const DispatchPage = () => {
  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>
        Assign vehicles and manage delivery operations.
      </p>

      <DispatchOrders />
    </div>
  );
};