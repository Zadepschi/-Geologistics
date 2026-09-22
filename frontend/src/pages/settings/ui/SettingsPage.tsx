import { useSettingsStore } from "@/shared/store/settings";
import styles from "./SettingsPage.module.scss";

export const SettingsPage = () => {
  const {
    deliveryUpdates,
    vehicleAlerts,
    routeAlerts,
    distanceUnit,
    setDeliveryUpdates,
    setVehicleAlerts,
    setRouteAlerts,
    setDistanceUnit,
  } = useSettingsStore();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your preferences and notifications.</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Notifications</h2>
            <p>Choose which notifications you want to receive.</p>
          </div>

          <div className={styles.settingRow}>
            <div>
              <h3>Delivery updates</h3>
              <p>
                Receive notifications about delivery status changes.
              </p>
            </div>

            <input
              type="checkbox"
              checked={deliveryUpdates}
              onChange={(e) =>
                setDeliveryUpdates(e.target.checked)
              }
            />
          </div>

          <div className={styles.settingRow}>
            <div>
              <h3>Vehicle alerts</h3>
              <p>
                Receive notifications about vehicle status changes.
              </p>
            </div>

            <input
              type="checkbox"
              checked={vehicleAlerts}
              onChange={(e) =>
                setVehicleAlerts(e.target.checked)
              }
            />
          </div>

          <div className={styles.settingRow}>
            <div>
              <h3>Route alerts</h3>
              <p>
                Receive notifications about route changes or deviations.
              </p>
            </div>

            <input
              type="checkbox"
              checked={routeAlerts}
              onChange={(e) =>
                setRouteAlerts(e.target.checked)
              }
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Preferences</h2>
            <p>Customize your dashboard experience.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="distance">
              Distance unit
            </label>

            <select
              id="distance"
              value={distanceUnit}
              onChange={(e) =>
                setDistanceUnit(
                  e.target.value as "km" | "mi"
                )
              }
            >
              <option value="km">
                Kilometers (km)
              </option>

              <option value="mi">
                Miles (mi)
              </option>
            </select>
          </div>
        </section>
      </div>
    </div>
  );
};