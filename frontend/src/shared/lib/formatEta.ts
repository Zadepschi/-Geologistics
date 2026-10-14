export const formatEta = (
  etaMinutes?: number | null,
): string => {
  if (
    typeof etaMinutes !== "number" ||
    !Number.isFinite(etaMinutes)
  ) {
    return "—";
  }

  if (etaMinutes <= 0) {
    return "Arrived";
  }

  const hours = Math.floor(etaMinutes / 60);
  const minutes = etaMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
};