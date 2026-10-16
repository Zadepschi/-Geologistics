

import { Typography } from "@/shared/ui/Typography";
import styles from "./Footer.module.scss";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <div className={styles.logo}>
  <img src="/pic/logotip.png" alt="Geologistics" />
</div>

        <div className={styles.brandInfo}>
          <Typography
            as="span"
            variant="body"
            className={styles.brandName}
          >
            Geologistics
          </Typography>

          <Typography
            as="span"
            variant="bodySmall"
            className={styles.tagline}
          >
            Logistics Management System
          </Typography>
        </div>

        <span className={styles.demoBadge}>DEMO</span>
      </div>

      <div className={styles.bottom}>
        <Typography
          as="span"
          variant="bodySmall"
          className={styles.copyright}
        >
          © {new Date().getFullYear()} Geologistics
        </Typography>

        <Typography
          as="span"
          variant="bodySmall"
          className={styles.author}
        >
          Designed & Developed by{" "}
          <span className={styles.authorName}>Zadepschi</span>
        </Typography>
      </div>
    </footer>
  );
};
