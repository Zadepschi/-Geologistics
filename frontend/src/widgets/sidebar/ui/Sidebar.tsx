
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  CircleHelp,
} from "lucide-react";

import { Typography } from "@/shared/ui/Typography";
import { navigation } from "../model/navigation";
import styles from "./Sidebar.module.scss";

const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1100px)";

export const Sidebar = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(MOBILE_QUERY).matches
      : false
  );

  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(TABLET_QUERY).matches
      : false
  );

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    const saved = localStorage.getItem("sidebar-collapsed");

    if (saved !== null) return saved === "true";

    return window.matchMedia(TABLET_QUERY).matches;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mobileMedia = window.matchMedia(MOBILE_QUERY);
    const tabletMedia = window.matchMedia(TABLET_QUERY);

    const updateScreenSize = () => {
      setIsMobile(mobileMedia.matches);
      setIsTablet(tabletMedia.matches);

      if (!mobileMedia.matches) {
        setMobileOpen(false);
      }
    };

    updateScreenSize();

    mobileMedia.addEventListener("change", updateScreenSize);
    tabletMedia.addEventListener("change", updateScreenSize);

    return () => {
      mobileMedia.removeEventListener("change", updateScreenSize);
      tabletMedia.removeEventListener("change", updateScreenSize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // На телефоне подписи всегда видны внутри открытого меню.
  const showLabels = isMobile || !collapsed;

  const sidebarClassName = [
    styles.sidebar,
    collapsed && !isMobile ? styles.collapsed : "",
    isTablet && collapsed ? styles.tabletCollapsed : "",
    isMobile ? styles.mobile : "",
    isMobile && mobileOpen ? styles.mobileOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <>
      {isMobile && (
        <>
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={mobileOpen}
          >
            <Menu size={22} />
          </button>

          {mobileOpen && (
            <button
              type="button"
              className={styles.overlay}
              onClick={closeMobileMenu}
              aria-label="Закрыть меню"
            />
          )}
        </>
      )}

      <aside
        className={sidebarClassName}
        aria-label="Основная навигация"
        aria-hidden={isMobile && !mobileOpen}
      >
        <div className={styles.top}>
          <div className={styles.brand}>
            <img
              src="/pic/logotip.png"
              alt="Geologistics"
              className={styles.brandLogo}
            />

            {showLabels && (
              <Typography
                as="span"
                variant="body"
                className={styles.brandText}
              >
                Geologistics
              </Typography>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              className={styles.toggle}
              onClick={closeMobileMenu}
              aria-label="Закрыть меню"
              title="Закрыть меню"
            >
              <X size={20} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setCollapsed((previous) => !previous)}
              aria-label={
                collapsed ? "Развернуть меню" : "Свернуть меню"
              }
              title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          )}
        </div>

        {navigation.map((section) => (
          <div key={section.title} className={styles.section}>
            {showLabels && (
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
                    title={!showLabels ? item.label : undefined}
                    onClick={isMobile ? closeMobileMenu : undefined}
                    className={({ isActive }) =>
                      [
                        styles.link,
                        isActive ? styles.active : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    <span className={styles.icon}>
                      <Icon size={18} />
                    </span>

                    {showLabels && (
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

        <div className={styles.support} title={!showLabels ? "Поддержка" : undefined}>
          <span className={styles.icon}>
            <CircleHelp size={18} />
          </span>

          {showLabels && (
            <Typography
              as="span"
              variant="body"
              className={styles.label}
            >
              Поддержка
            </Typography>
          )}
        </div>
      </aside>
    </>
  );
};
