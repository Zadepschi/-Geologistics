CREATE TABLE clients (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE vehicles (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,

  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  telemetry_updated_at TIMESTAMPTZ,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE drivers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL,

  vehicle_id VARCHAR(50)
    REFERENCES vehicles(id),

  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE delivery_addresses (
  id BIGSERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);


CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,

  client_id VARCHAR(50) NOT NULL
    REFERENCES clients(id),

  delivery_address_id BIGINT NOT NULL
    REFERENCES delivery_addresses(id),

  driver_id VARCHAR(50)
    REFERENCES drivers(id),

  vehicle_id VARCHAR(50)
    REFERENCES vehicles(id),

  status VARCHAR(30) NOT NULL,
  eta TIME
);


CREATE TABLE delivery_routes (
  id BIGSERIAL PRIMARY KEY,

  order_id VARCHAR(50) NOT NULL
    REFERENCES orders(id),

  vehicle_id VARCHAR(50)
    REFERENCES vehicles(id),

  driver_id VARCHAR(50)
    REFERENCES drivers(id),

  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,

  finish_lat DOUBLE PRECISION NOT NULL,
  finish_lng DOUBLE PRECISION NOT NULL,

  path JSONB NOT NULL,

  -- Текущая точка маршрута.
  -- 0 = первая точка path.
  current_path_index INTEGER NOT NULL DEFAULT 0
    CHECK (current_path_index >= 0),

  -- Точки маршрута, которые уже пройдены.
  completed_path JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Время последнего сохранения прогресса маршрута.
  last_progress_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);


CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE
);


-- =========================================================
-- Индексы delivery_routes
-- =========================================================

CREATE INDEX idx_delivery_routes_order_id
  ON delivery_routes(order_id);


CREATE INDEX idx_delivery_routes_vehicle_id
  ON delivery_routes(vehicle_id);


-- Один активный маршрут на один заказ.
-- Завершённые маршруты не участвуют в этом ограничении.

CREATE UNIQUE INDEX ux_delivery_routes_active_order
  ON delivery_routes(order_id)
  WHERE completed_at IS NULL;