const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/equipos
router.get('/', async (req, res) => {
  try {
    const { tipo, area } = req.query;
    let query = 'SELECT * FROM equipos WHERE activo = true';
    const params = [];
    if (tipo) { params.push(tipo); query += ` AND tipo = $${params.length}`; }
    if (area) { params.push(area); query += ` AND area = $${params.length}`; }
    query += ' ORDER BY tipo, nombre';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/equipos/:id/tareas
router.get('/:id/tareas', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, 
        COUNT(p.id) AS total_programaciones,
        COUNT(p.id) FILTER (WHERE p.estado = 'COMPLETADO') AS completadas,
        COUNT(p.id) FILTER (WHERE p.estado = 'VENCIDO') AS vencidas,
        COUNT(p.id) FILTER (WHERE p.estado = 'PENDIENTE') AS pendientes
      FROM tareas t
      LEFT JOIN programacion p ON p.tarea_id = t.id
      WHERE t.equipo_id = $1 AND t.activo = true
      GROUP BY t.id
      ORDER BY t.plan, t.parte
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
