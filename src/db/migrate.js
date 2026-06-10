require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(30) NOT NULL DEFAULT 'TECNICO',
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS equipos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        tipo VARCHAR(80),
        area VARCHAR(80),
        descripcion TEXT,
        activo BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS tareas (
        id SERIAL PRIMARY KEY,
        equipo_id INTEGER REFERENCES equipos(id),
        parte VARCHAR(150),
        plan VARCHAR(30) NOT NULL,
        actividad TEXT NOT NULL,
        requiere_espacio BOOLEAN DEFAULT false,
        responsable VARCHAR(80),
        dias_duracion INTEGER DEFAULT 1,
        horas_duracion DECIMAL(4,1),
        activo BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS programacion (
        id SERIAL PRIMARY KEY,
        tarea_id INTEGER REFERENCES tareas(id),
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE,
        estado VARCHAR(30) DEFAULT 'PENDIENTE',
        completado_por INTEGER REFERENCES usuarios(id),
        completado_en TIMESTAMP,
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_programacion_fecha ON programacion(fecha_inicio);
      CREATE INDEX IF NOT EXISTS idx_programacion_estado ON programacion(estado);
      CREATE INDEX IF NOT EXISTS idx_tareas_equipo ON tareas(equipo_id);
      CREATE INDEX IF NOT EXISTS idx_tareas_plan ON tareas(plan);
    `);
    console.log('✅ Migración completada');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
