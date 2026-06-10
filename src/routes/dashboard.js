const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/dashboard - resumen general
router.get('/', async (req, res) => {
  try {
    const [resumen, porPlan, porEquipoTipo, proximas, vencidas] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS pendientes,
          COUNT(*) FILTER (WHERE estado = 'COMPLETADO') AS completadas,
          COUNT(*) FILTER (WHERE estado = 'VENCIDO') AS vencidas,
          COUNT(*) FILTER (WHERE estado = 'EN_PROGRESO') AS en_progreso,
          COUNT(*) AS total
        FROM programacion
      `),
      pool.query(`
        SELECT t.plan, 
          COUNT(*) FILTER (WHERE p.estado = 'COMPLETADO') AS completadas,
          COUNT(*) FILTER (WHERE p.estado = 'VENCIDO') AS vencidas,
          COUNT(*) FILTER (WHERE p.estado = 'PENDIENTE') AS pendientes
        FROM tareas t
        JOIN programacion p ON p.tarea_id = t.id
        GROUP BY t.plan ORDER BY t.plan
      `),
      pool.query(`
        SELECT e.tipo,
          COUNT(*) FILTER (WHERE p.estado = 'COMPLETADO') AS completadas,
          COUNT(*) FILTER (WHERE p.estado = 'VENCIDO') AS vencidas,
          COUNT(*) FILTER (WHERE p.estado = 'PENDIENTE') AS pendientes
        FROM equipos e
        JOIN tareas t ON t.equipo_id = e.id
        JOIN programacion p ON p.tarea_id = t.id
        GROUP BY e.tipo ORDER BY e.tipo
      `),
      pool.query(`
        SELECT p.id, e.nombre AS equipo, t.actividad, t.plan, t.parte, p.fecha_inicio, p.fecha_fin, p.estado
        FROM programacion p
        JOIN tareas t ON t.id = p.tarea_id
        JOIN equipos e ON e.id = t.equipo_id
        WHERE p.estado = 'PENDIENTE' AND p.fecha_inicio >= CURRENT_DATE
        ORDER BY p.fecha_inicio ASC LIMIT 15
      `),
      pool.query(`
        SELECT p.id, e.nombre AS equipo, t.actividad, t.plan, t.parte, p.fecha_inicio, p.fecha_fin, p.estado
        FROM programacion p
        JOIN tareas t ON t.id = p.tarea_id
        JOIN equipos e ON e.id = t.equipo_id
        WHERE p.estado = 'VENCIDO'
        ORDER BY p.fecha_inicio DESC LIMIT 15
      `),
    ]);

    res.json({
      resumen: resumen.rows[0],
      porPlan: porPlan.rows,
      porEquipoTipo: porEquipoTipo.rows,
      proximas: proximas.rows,
      vencidas: vencidas.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error cargando dashboard' });
  }
});

module.exports = router;
