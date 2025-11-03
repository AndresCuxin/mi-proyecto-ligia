-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS registro_comidas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE registro_comidas;

-- Crear tabla de registros de ventas/comidas
CREATE TABLE IF NOT EXISTS registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto VARCHAR(120) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  fecha_venta DATE NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
