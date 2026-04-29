import type  { ReactNode } from "react";
import styles from "./PageLayout.module.scss";

interface PageLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  content: ReactNode;
}

export const PageLayout = ({ sidebar, header, content }: PageLayoutProps) => {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <div className={styles.main}>
        <header className={styles.header}>{header}</header>
        <main className={styles.content}>{content}</main>
      </div>
    </div>
  );
};