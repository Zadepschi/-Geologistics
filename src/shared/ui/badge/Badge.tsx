import type  { ReactNode } from "react";
import styles from "./Badge.module.scss";
import { cn } from "@/shared/lib/cn";

interface BadgeProps {
  children: ReactNode;
  tone?: "green" | "blue" | "yellow" | "red" | "purple" | "gray";
}

export const Badge = ({ children, tone = "gray" }: BadgeProps) => {
  return <span className={cn(styles.badge, styles[tone])}>{children}</span>;
};