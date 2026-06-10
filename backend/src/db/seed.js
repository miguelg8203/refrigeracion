require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ── DATOS REALES EXTRAÍDOS DEL EXCEL ──────────────────────────────────────────
const equiposData = [
  { nombre: 'CAVA VISCERAS BLANCAS Y ROJAS', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 1', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 2', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 3', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 4', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 5', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 6A', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 6B', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 7', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 8', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 9', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 10', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA 12', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA PATAS Y CABEZAS', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA RETENIDOS', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA OREO EQUIPO 1', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA OREO EQUIPO 2', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA OREO EQUIPO 3', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA OREO EQUIPO 4', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA VIRILES', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA LENGUAS', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA RECEPCION DE VISCERAS ROJAS', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA DE ACONDICIONAMIENTO', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA TUNEL DE CONGELACION', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'CAVA DE ENFRIAMIENTO RAPIDO', tipo: 'CAVA', area: 'PRODUCCION' },
  { nombre: 'MUELLE 1', tipo: 'MUELLE', area: 'LOGISTICA' },
  { nombre: 'MUELLE 2', tipo: 'MUELLE', area: 'LOGISTICA' },
  { nombre: 'MUELLE 3', tipo: 'MUELLE', area: 'LOGISTICA' },
  { nombre: 'MUELLE 4', tipo: 'MUELLE', area: 'LOGISTICA' },
  { nombre: 'MUELLE 7', tipo: 'MUELLE', area: 'LOGISTICA' },
  { nombre: 'COMPRESOR RECIPROCANTE #1', tipo: 'COMPRESOR', area: 'SALA MAQUINAS' },
  { nombre: 'COMPRESOR RECIPROCANTE #2', tipo: 'COMPRESOR', area: 'SALA MAQUINAS' },
  { nombre: 'COMPRESOR RECIPROCANTE #3', tipo: 'COMPRESOR', area: 'SALA MAQUINAS' },
  { nombre: 'COMPRESOR MONOTORNILLO', tipo: 'COMPRESOR', area: 'SALA MAQUINAS' },
  { nombre: 'BOMBAS RECIRCULADORAS NH3', tipo: 'BOMBA', area: 'SALA MAQUINAS' },
  { nombre: 'BOMBAS CENTRIFUGA GLICOL', tipo: 'BOMBA', area: 'SALA MAQUINAS' },
  { nombre: 'BOMBA CENTRIFUGA GLICOL #1', tipo: 'BOMBA', area: 'SALA MAQUINAS' },
  { nombre: 'BOMBA CENTRIFUGA GLICOL #2', tipo: 'BOMBA', area: 'SALA MAQUINAS' },
  { nombre: 'BOMBA RECIRCULADORA NH3 #1 Y #3', tipo: 'BOMBA', area: 'SALA MAQUINAS' },
  { nombre: 'BOMBA RECIRCULADORA NH3 #2 Y #6', tipo: 'BOMBA', area: 'SALA MAQUINAS' },
  { nombre: 'BOMBA RECIRCULADORA NH3 #4 Y #5', tipo: 'BOMBA', area: 'SALA MAQUINAS' },
  { nombre: 'TANQUE ECONOMEIZER', tipo: 'TANQUE', area: 'SALA MAQUINAS' },
  { nombre: 'TANQUE ACUMULADOR VERTICAL Y HORIZONTAL', tipo: 'TANQUE', area: 'SALA MAQUINAS' },
  { nombre: 'TANQUE RECIRCULADOR #1, #2 Y #3', tipo: 'TANQUE', area: 'SALA MAQUINAS' },
  { nombre: 'SALA DE PROCESO DESPOSTE', tipo: 'SALA', area: 'PRODUCCION' },
  { nombre: 'SALA DE EMPAQUE Y ETIQUETADO', tipo: 'SALA', area: 'PRODUCCION' },
  { nombre: 'SALA DE ALISTAMIENTO PICKING', tipo: 'SALA', area: 'PRODUCCION' },
  { nombre: 'PASILLO CAVAS', tipo: 'PASILLO', area: 'PRODUCCION' },
  { nombre: 'PASILLO CUARTEO', tipo: 'PASILLO', area: 'PRODUCCION' },
  { nombre: 'PASILLO MUELLE', tipo: 'PASILLO', area: 'LOGISTICA' },
];

// Tareas por tipo de equipo (plan → parte → actividad → requiere_espacio)
const tareasPlantilla = {
  CAVA_TABLERO: [
    { parte: 'TABLERO ELECTRICO', plan: 'MENSUAL', actividad: 'INSPECCION DE TABLERO POTENCIA Y CONTROL', requiere_espacio: false, dias: 1, horas: 1 },
  ],
  CAVA_TREN_BIMENSUAL: [
    { parte: 'TREN DE VALVULAS', plan: 'BIMENSUAL', actividad: 'INSPECCION Y LUBRICACION', requiere_espacio: false, dias: 1, horas: 2 },
  ],
  CAVA_TREN_TRIMESTRAL: [
    { parte: 'TREN DE VALVULAS', plan: 'TRIMESTRAL', actividad: 'INSPECCION Y LUBRICACION EVAPORADORES', requiere_espacio: false, dias: 1, horas: 2 },
  ],
  CAVA_TREN_ANUAL: [
    { parte: 'TREN DE VALVULAS', plan: 'ANUAL', actividad: 'PLAN ANUAL - REVISION COMPLETA', requiere_espacio: true, dias: 2, horas: null },
  ],
  CAVA_EVAP_SEMESTRAL: [
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'LAVADO DE ESTRUCTURA Y SERPENTIN - REVISION DE SONDAS', requiere_espacio: true, dias: 1, horas: null },
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'INSPECCION DE MOTORES', requiere_espacio: true, dias: 2, horas: null },
  ],
  MUELLE_TABLERO: [
    { parte: 'TABLERO ELECTRICO', plan: 'MENSUAL', actividad: 'INSPECCION', requiere_espacio: false, dias: 1, horas: 1 },
    { parte: 'TREN DE VALVULAS', plan: 'BIMENSUAL', actividad: 'INSPECCION Y LUBRICACION', requiere_espacio: false, dias: 1, horas: 2 },
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'LAVADO DE ESTRUCTURA Y SERPENTIN - REVISION DE SONDAS', requiere_espacio: true, dias: 1, horas: null },
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'INSPECCION DE MOTORES', requiere_espacio: true, dias: 1, horas: null },
    { parte: 'TREN DE VALVULAS', plan: 'ANUAL', actividad: 'PLAN ANUAL', requiere_espacio: true, dias: 2, horas: null },
  ],
  COMPRESOR_RECIPROCANTE: [
    { parte: 'COMPRESOR', plan: 'MENSUAL', actividad: 'INSPECCION Y LIMPIEZA', requiere_espacio: false, dias: 1, horas: 4 },
    { parte: 'COMPRESOR', plan: 'BIMENSUAL', actividad: 'INSPECCION, LUBRICACION Y LIMPIEZA', requiere_espacio: false, dias: 1, horas: 6 },
    { parte: 'COMPRESOR', plan: 'SEMESTRAL', actividad: 'INSPECCION, VERIFICACION, LUBRICACION Y LIMPIEZA SEMESTRAL', requiere_espacio: false, dias: 2, horas: 8 },
  ],
  COMPRESOR_MONOTORNILLO: [
    { parte: 'COMPRESOR', plan: 'BIMENSUAL', actividad: 'INSPECCION, LUBRICACION Y LIMPIEZA', requiere_espacio: false, dias: 1, horas: 6 },
    { parte: 'COMPRESOR', plan: 'SEMESTRAL', actividad: 'INSPECCION, LUBRICACION, AJUSTE Y LIMPIEZA SEMESTRAL', requiere_espacio: false, dias: 2, horas: 8 },
    { parte: 'COMPRESOR', plan: 'ANUAL', actividad: 'INSPECCION, LUBRICACION, AJUSTE Y LIMPIEZA ANUAL', requiere_espacio: false, dias: 2, horas: 10 },
  ],
  BOMBA_NH3: [
    { parte: 'BOMBA', plan: 'MENSUAL', actividad: 'REVISION Y MANTENIMIENTO MENSUAL', requiere_espacio: false, dias: 1, horas: 2 },
    { parte: 'BOMBA', plan: 'TRIMESTRAL', actividad: 'REVISION, LIMPIEZA Y VERIFICACION', requiere_espacio: false, dias: 1, horas: 4 },
    { parte: 'BOMBA', plan: 'ANUAL', actividad: 'VERIFICACION, LIMPIEZA Y PINTURA', requiere_espacio: false, dias: 2, horas: 8 },
  ],
  BOMBA_GLICOL: [
    { parte: 'BOMBA', plan: 'TRIMESTRAL', actividad: 'REVISION Y MANTENIMIENTO', requiere_espacio: false, dias: 1, horas: 3 },
    { parte: 'BOMBA', plan: 'ANUAL', actividad: 'REVISION, LIMPIEZA Y PINTURA', requiere_espacio: false, dias: 2, horas: 6 },
  ],
  TANQUE: [
    { parte: 'TANQUE', plan: 'TRIMESTRAL', actividad: 'PLAN TRIMESTRAL', requiere_espacio: false, dias: 1, horas: 3 },
    { parte: 'TANQUE', plan: 'SEMESTRAL', actividad: 'PLAN SEMESTRAL', requiere_espacio: false, dias: 1, horas: 4 },
    { parte: 'TANQUE', plan: 'ANUAL', actividad: 'PLAN ANUAL - REVISION COMPLETA', requiere_espacio: true, dias: 2, horas: 8 },
  ],
  SALA_VALVULAS: [
    { parte: 'ESTACION DE VALVULAS', plan: 'MENSUAL', actividad: 'INSPECCION', requiere_espacio: false, dias: 1, horas: 1 },
    { parte: 'TABLERO', plan: 'MENSUAL', actividad: 'INSPECCION', requiere_espacio: false, dias: 1, horas: 1 },
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'LAVADO DE ESTRUCTURA Y SERPENTIN - REVISION DE SONDAS', requiere_espacio: true, dias: 1, horas: null },
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'INSPECCION DE MOTORES', requiere_espacio: true, dias: 2, horas: null },
  ],
  MUELLE_CONDENSADORA: [
    { parte: 'UNIDAD CONDENSADORA', plan: 'MENSUAL', actividad: 'REVISION Y LIMPIEZA', requiere_espacio: false, dias: 1, horas: 3 },
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'LAVADO DE ESTRUCTURA Y SERPENTIN - REVISION DE SONDAS', requiere_espacio: true, dias: 1, horas: null },
    { parte: 'EVAPORADOR', plan: 'SEMESTRAL', actividad: 'INSPECCION DE MOTORES', requiere_espacio: true, dias: 1, horas: null },
    { parte: 'EVAPORADOR Y UNIDAD CONDENSADORA', plan: 'ANUAL', actividad: 'REVISION GENERAL DE EVAPORADORES Y CONDENSADORA', requiere_espacio: true, dias: 2, horas: null },
  ],
};

// Mapeo equipo → plantilla de tareas
function getTareasParaEquipo(equipo) {
  const n = equipo.nombre.toUpperCase();
  const t = equipo.tipo;
  const tareas = [];

  if (t === 'CAVA') {
    // Cavas con tablero eléctrico (la mayoría)
    const sinTablero = ['CAVA DE ACONDICIONAMIENTO', 'CAVA RECEPCION DE VISCERAS ROJAS', 'CAVA TUNEL DE CONGELACION', 'CAVA DE ENFRIAMIENTO RAPIDO', 'CAVA VIRILES', 'CAVA LENGUAS'];
    if (!sinTablero.includes(n)) {
      tareas.push(...tareasPlantilla.CAVA_TABLERO);
      tareas.push(...tareasPlantilla.CAVA_TREN_BIMENSUAL);
    } else {
      tareas.push(...tareasPlantilla.MUELLE_CONDENSADORA);
    }
    // Cavas con tren trimestral
    if (['CAVA 5', 'CAVA 6A', 'CAVA 6B', 'CAVA 7', 'CAVA OREO EQUIPO 1', 'CAVA OREO EQUIPO 2', 'CAVA OREO EQUIPO 3', 'CAVA OREO EQUIPO 4'].includes(n)) {
      tareas.push(...tareasPlantilla.CAVA_TREN_TRIMESTRAL);
    }
    if (!sinTablero.includes(n)) {
      tareas.push(...tareasPlantilla.CAVA_EVAP_SEMESTRAL);
      tareas.push(...tareasPlantilla.CAVA_TREN_ANUAL);
    }
  } else if (t === 'MUELLE') {
    tareas.push(...tareasPlantilla.MUELLE_TABLERO);
  } else if (n.includes('COMPRESOR RECIPROCANTE')) {
    tareas.push(...tareasPlantilla.COMPRESOR_RECIPROCANTE);
  } else if (n.includes('COMPRESOR MONOTORNILLO')) {
    tareas.push(...tareasPlantilla.COMPRESOR_MONOTORNILLO);
  } else if (n.includes('NH3')) {
    tareas.push(...tareasPlantilla.BOMBA_NH3);
  } else if (n.includes('GLICOL')) {
    tareas.push(...tareasPlantilla.BOMBA_GLICOL);
  } else if (t === 'TANQUE') {
    tareas.push(...tareasPlantilla.TANQUE);
  } else if (t === 'SALA' || t === 'PASILLO') {
    tareas.push(...tareasPlantilla.SALA_VALVULAS);
  }

  return tareas.map(t => ({ ...t, responsable: 'FABIAN' }));
}

// Genera fechas de programación para 2025-2026 según frecuencia del plan
function generarFechas(plan, fechaBase) {
  const fechas = [];
  const inicio = new Date('2025-06-01');
  const fin = new Date('2026-06-30');
  let cursor = new Date(fechaBase);

  const intervalos = {
    'MENSUAL': 30,
    'BIMENSUAL': 60,
    'TRIMESTRAL': 90,
    'SEMESTRAL': 180,
    'ANUAL': 365,
  };

  const dias = intervalos[plan] || 30;

  while (cursor <= fin) {
    if (cursor >= inicio) {
      fechas.push(new Date(cursor));
    }
    cursor = new Date(cursor.getTime() + dias * 24 * 60 * 60 * 1000);
  }

  return fechas;
}

async function seed() {
  const client = await pool.connect();
  try {
    // ── 1. LIMPIAR TABLAS ─────────────────────────────────────────────────────
    await client.query('TRUNCATE programacion, tareas, equipos, usuarios RESTART IDENTITY CASCADE');
    console.log('🧹 Tablas limpiadas');

    // ── 2. SUPER ADMIN ────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Cielo0306*', 10);
    await client.query(`
      INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Super Admin', 'miguelg8203@gmail.com', passwordHash, 'SUPER_ADMIN', true]);
    console.log('👤 Super Admin creado: miguelg8203@gmail.com / Cielo0306*');

    // Usuario técnico de ejemplo
    const techHash = await bcrypt.hash('Fabian2025*', 10);
    await client.query(`
      INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
      VALUES ($1, $2, $3, $4, $5)
    `, ['Fabian Tecnico', 'fabian@refrigeracion.co', techHash, 'TECNICO', true]);
    console.log('👤 Técnico creado: fabian@refrigeracion.co / Fabian2025*');

    // ── 3. EQUIPOS ────────────────────────────────────────────────────────────
    const equipoIds = {};
    for (const eq of equiposData) {
      const res = await client.query(`
        INSERT INTO equipos (nombre, tipo, area) VALUES ($1, $2, $3) RETURNING id
      `, [eq.nombre, eq.tipo, eq.area]);
      equipoIds[eq.nombre] = res.rows[0].id;
    }
    console.log(`✅ ${equiposData.length} equipos insertados`);

    // ── 4. TAREAS + PROGRAMACIÓN ──────────────────────────────────────────────
    let totalTareas = 0;
    let totalProg = 0;

    // Fechas base escalonadas por equipo (para distribuir carga real del cronograma)
    const fechasBase = {
      'MENSUAL':    '2025-06-01',
      'BIMENSUAL':  '2025-06-15',
      'TRIMESTRAL': '2025-06-06',
      'SEMESTRAL':  '2025-06-01',
      'ANUAL':      '2025-06-15',
    };

    for (const equipo of equiposData) {
      const equipoId = equipoIds[equipo.nombre];
      const tareas = getTareasParaEquipo(equipo);

      for (const tarea of tareas) {
        const res = await client.query(`
          INSERT INTO tareas (equipo_id, parte, plan, actividad, requiere_espacio, responsable, dias_duracion, horas_duracion)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
        `, [equipoId, tarea.parte, tarea.plan, tarea.actividad, tarea.requiere_espacio, tarea.responsable, tarea.dias || 1, tarea.horas || null]);
        totalTareas++;

        const tareaId = res.rows[0].id;
        const fechaBase = new Date(fechasBase[tarea.plan] || '2025-06-01');
        const fechas = generarFechas(tarea.plan, fechaBase);

        for (const fecha of fechas) {
          const fechaFin = new Date(fecha.getTime() + (tarea.dias || 1) * 24 * 60 * 60 * 1000);
          // Marcar las pasadas como VENCIDO o COMPLETADO aleatoriamente para demo
          const hoy = new Date('2026-06-09');
          let estado = 'PENDIENTE';
          if (fecha < hoy) {
            estado = Math.random() > 0.35 ? 'COMPLETADO' : 'VENCIDO';
          }

          await client.query(`
            INSERT INTO programacion (tarea_id, fecha_inicio, fecha_fin, estado)
            VALUES ($1, $2, $3, $4)
          `, [tareaId, fecha.toISOString().split('T')[0], fechaFin.toISOString().split('T')[0], estado]);
          totalProg++;
        }
      }
    }

    console.log(`✅ ${totalTareas} tareas insertadas`);
    console.log(`✅ ${totalProg} programaciones generadas`);
    console.log('\n🚀 Seed completado exitosamente');
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
