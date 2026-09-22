import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, CircleHelp } from "lucide-react";
import { Typography } from "@/shared/ui/Typography";
import styles from "./Sidebar.module.scss";
import { navigation } from "../model/navigation";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>G</span>

          {!collapsed && (
            <Typography as="span" variant="body" className={styles.brandText}>
              Geologistics
            </Typography>
          )}
        </div>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {navigation.map((section) => (
        <div key={section.title} className={styles.section}>
          {!collapsed && (
            <Typography
              as="div"
              variant="bodySmall"
              className={styles.sectionTitle}
            >
              {section.title}
            </Typography>
          )}

          <div className={styles.links}>
            {section.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  <span className={styles.icon}>
                    <Icon size={18} />
                  </span>

                  {!collapsed && (
                    <Typography
                      as="span"
                      variant="body"
                      className={styles.label}
                    >
                      {item.label}
                    </Typography>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}

      <div className={styles.support} title={collapsed ? "Support" : undefined}>
        <span className={styles.icon}>
          <CircleHelp size={18} />
        </span>

        {!collapsed && (
          <Typography as="span" variant="body" className={styles.label}>
            Support
          </Typography>
        )}
      </div>
    </aside>
  );
};