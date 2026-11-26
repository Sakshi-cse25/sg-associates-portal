-- Relational Database Schema (SQLite dialect for zero-setup portable execution)
-- Mirrors the MySQL schema designed during the S.G. Associates internship (Tables 4.1 - 4.4)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS services (
  service_id  INTEGER PRIMARY KEY AUTOINCREMENT,
  title       VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  icon        VARCHAR(100),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id  INTEGER PRIMARY KEY AUTOINCREMENT,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  phone       VARCHAR(15),
  service_id  INTEGER,
  message     TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In progress', 'Closed')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projects (
  project_id  INTEGER PRIMARY KEY AUTOINCREMENT,
  title       VARCHAR(150) NOT NULL,
  summary     TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Ongoing')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  image_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER,
  file_path   VARCHAR(255) NOT NULL,
  caption     VARCHAR(150) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admins (
  admin_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  last_login    DATETIME
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
