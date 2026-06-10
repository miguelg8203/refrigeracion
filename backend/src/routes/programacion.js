const router = require('express').Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/programacion?mes=2025-06&equipo_id=1&plan=MENSUAL&estado=PENDIENTE
router.get('/', async (req, res) => {
  try {
    const { mes, equipo_id, plan, estado, responsable } = req.query;
    let conditions = [];
    const params = [];

    if (mes) {
      params.push(mes + '-01');
      params.push(mes + '-31');
      conditions.push(`p.fecha_inicio BETWEEN $${params.length - 1} AND $${params.length}`);
    }
    if (equipo_id) { params.push(equipo_id); conditions.push(`e.id = $${params.length}`); }
    if (plan) { params.push(plan); conditions.push(`t.plan = $${params.length}`); }
    if (estado) { params.push(estado); conditions.push(`p.estado = $${params.length}`); }
    if (responsable) { params.push(`%${responsable}%`); conditions.push(`t.responsable ILIKE $${params.length}`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(`
      SELECT 
        p.id, p.fecha_inicio, p.fecha_fin, p.estado, p.observaciones, p.completado_en,
        t.id AS tarea_id, t.plan, t.actividad, t.parte, t.requiere_espacio, t.responsable,
        t.dias_duracion, t.horas_duracion,
        e.id AS equipo_id, e.nombre AS equipo, e.tipo AS equipo_tipo, e.area,
        u.nombre AS completado_por_nombre
      FROM programacion p
      JOIN tareas t ON t.id = p.tarea_id
      JOIN equipos e ON e.id = t.equipo_id
      LEFT JOIN usuarios u ON u.id = p.completado_por
      ${where}
      ORDER BY p.fecha_inicio ASC, e.nombre ASC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/programacion/:id/completar
router.patch('/:id/completar', async (req, res) => {
  const { observaciones } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE programacion 
      SET estado = 'COMPLETADO', completado_por = $1, completado_en = NOW(), observaciones = $2
      WHERE id = $3
      RETURNING *
    `, [req.user.id, observaciones || null, req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Programación no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/programacion/:id/vencer
router.patch('/:id/vencer', async (req, res) => {
  const { observaciones } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE programacion SET estado = 'VENCIDO', observaciones = $1 WHERE id = $2 RETURNING *
    `, [observaciones || null, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/programacion/:id/pendiente (reabrir)
router.patch('/:id/pendiente', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE programacion SET estado = 'PENDIENTE', completado_por = NULL, completado_en = NULL, observaciones = NULL
      WHERE id = $1 RETURNING *
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/programacion/mes-actual - tareas del mes actual agrupadas por semana
router.get('/mes-actual', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id, p.fecha_inicio, p.fecha_fin, p.estado,
        t.plan, t.actividad, t.parte, t.responsable,
        e.nombre AS equipo, e.tipo AS equipo_tipo, e.area,
        EXTRACT(WEEK FROM p.fecha_inicio) AS semana
      FROM programacion p
      JOIN tareas t ON t.id = p.tarea_id
      JOIN equipos e ON e.id = t.equipo_id
      WHERE DATE_TRUNC('month', p.fecha_inicio) = DATE_TRUNC('month', CURRENT_DATE)
      ORDER BY p.fecha_inicio ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
