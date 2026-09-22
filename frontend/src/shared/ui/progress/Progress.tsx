import styles from "./Progress.module.scss";

interface ProgressProps {
  value: number;
}

export const Progress = ({ value }: ProgressProps) => {
  return (
    <div className={styles.root}>
      <div className={styles.bar} style={{ width: `${value}%` }} />
    </div>
  );
};