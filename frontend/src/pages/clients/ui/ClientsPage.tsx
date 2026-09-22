import { ClientsList } from "@/widgets/clients-list";
import styles from "./ClientsPage.module.scss";

export const ClientsPage = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Manage clients and review their delivery activity.
        </p>
      </div>

      <div className={styles.content}>
        <ClientsList />
      </div>
    </div>
  );
};