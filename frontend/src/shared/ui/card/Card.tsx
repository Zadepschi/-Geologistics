import type  { ReactNode } from "react";
import styles from "./Card.module.scss";
import { cn } from "@/shared/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return <div className={cn(styles.card, className)}>{children}</div>;
};