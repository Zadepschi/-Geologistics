import { useEffect } from "react";

import { advanceOrderProgress } from "@/shared/api/orders";

import { useFleetStore } from "@/shared/store/fleet";

const PROGRESS_INTERVAL_MS = 700;

const STEP_INTERVAL_MS = 700;

const calculateEtaMinutes = (
  pathLength: number,
  currentPathIndex: number,
  deliveryCompleted: boolean
): number => {
  if (
    deliveryCompleted ||
    pathLength < 2
  ) {
    return 0;
  }

  const remainingPoints =
    Math.max(
      0,
      pathLength -
        1 -
        currentPathIndex
    );

  if (
    remainingPoints <= 0
  ) {
    return 0;
  }

  const remainingMs =
    remainingPoints *
    STEP_INTERVAL_MS;

  return Math.max(
    1,
    Math.ceil(
      remainingMs / 60000
    )
  );
};

export const useLiveTracking = () => {
  useEffect(() => {
    let cancelled = false;

    let requestInProgress =
      false;

    const syncProgress =
      async () => {
        if (
          cancelled ||
          requestInProgress
        ) {
          return;
        }

        requestInProgress =
          true;

        try {
          const vehicles =
            useFleetStore
              .getState()
              .vehicles;

          const activeVehicles =
            vehicles.filter(
              (vehicle) =>
                vehicle.status ===
                  "on-route" &&
                vehicle.route &&
                !vehicle.route
                  .deliveryCompleted
            );

          if (
            activeVehicles.length ===
            0
          ) {
            return;
          }

          await Promise.all(
            activeVehicles.map(
              async (vehicle) => {
                const route =
                  vehicle.route;

                if (!route) {
                  return;
                }

                try {
                  /*
                   * PostgreSQL calculates
                   * the actual progress.
                   *
                   * Frontend does NOT increment
                   * currentPathIndex itself.
                   */
                  const result =
                    await advanceOrderProgress(
                      route.orderId
                    );

                  if (cancelled) {
                    return;
                  }

                  /*
                   * Backend now returns only
                   * progress information.
                   *
                   * It does NOT return:
                   * - path
                   * - completedPath
                   * - start
                   * - finish
                   *
                   * Those values are already
                   * available in `route`.
                   */
                  const backendRoute =
                    result.route;

                  if (
                    !backendRoute
                  ) {
                    return;
                  }

                  /*
                   * currentPathIndex comes
                   * from PostgreSQL.
                   */
                  const currentPathIndex =
                    Math.max(
                      0,
                      Math.min(
                        backendRoute.currentPathIndex,
                        route.path.length -
                          1
                      )
                    );

                  /*
                   * completed state also comes
                   * from backend.
                   */
                  const deliveryCompleted =
                    result.completed ||
                    Boolean(
                      backendRoute.completedAt
                    );

                  /*
                   * The full path is already
                   * stored in the frontend.
                   *
                   * We only derive the visually
                   * completed part from the index.
                   */
                  const completedPath =
                    route.path.slice(
                      0,
                      currentPathIndex +
                        1
                    );

                  /*
                   * ETA is calculated from the
                   * remaining route points.
                   *
                   * 1 point = 700 ms.
                   */
                  const etaMinutes =
                    calculateEtaMinutes(
                      route.path.length,
                      currentPathIndex,
                      deliveryCompleted
                    );

                  useFleetStore
                    .getState()
                    .setVehicleRouteState(
                      vehicle.id,
                      {
                        orderId:
                          route.orderId,

                        start:
                          route.start,

                        finish:
                          route.finish,

                        path:
                          route.path,

                        completedPath,

                        currentPathIndex,

                        deliveryCompleted,

                        etaMinutes,
                      }
                    );
                } catch (error) {
                  console.error(
                    `[useLiveTracking] Failed to sync delivery progress for order ${route.orderId}`,
                    error
                  );
                }
              }
            )
          );
        } finally {
          requestInProgress =
            false;
        }
      };

    /*
     * Initial synchronization.
     *
     * Important after:
     * - browser refresh;
     * - tab wake-up;
     * - computer sleep/wake.
     *
     * Backend calculates elapsed time
     * using lastProgressAt.
     */
    void syncProgress();

    const intervalId =
      window.setInterval(
        () => {
          void syncProgress();
        },
        PROGRESS_INTERVAL_MS
      );

    /*
     * Browser tab became visible again.
     */
    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void syncProgress();
        }
      };

    /*
     * Browser window became active again.
     */
    const handleFocus = () => {
      void syncProgress();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);
};