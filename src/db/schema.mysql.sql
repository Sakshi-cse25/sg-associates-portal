-- Reference MySQL Schema (as documented in Chapter 4, Tables 4.1 - 4.4 & Appendix B.1)

CREATE DATABASE IF NOT EXISTS sg_associates;
USE sg_associates;

CREATE TABLE services (
  service_id  INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  icon        VARCHAR(100) NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enquiries (
  enquiry_id  INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  phone       VARCHAR(15) NULL,
  service_id  INT NULL,
  message     TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'New',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE SET NULL
);

CREATE TABLE projects (
  project_id  INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  summary     TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'Completed'
);

CREATE TABLE gallery (
  image_id    INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NULL,
  file_path   VARCHAR(255) NOT NULL,
  caption     VARCHAR(150) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
);

CREATE TABLE admins (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  last_login    TIMESTAMP NULL
);
