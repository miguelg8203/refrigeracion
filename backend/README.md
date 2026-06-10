# 🧊 Sistema de Gestión de Mantenimiento - Refrigeración

App web para gestionar el cronograma de mantenimiento del sistema de refrigeración industrial.

## Stack
- **Frontend**: React (desplegable en Vercel / Netlify)
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL
- **Hosting**: Railway

---

## 🚀 Despliegue paso a paso

### 1. Crear repositorio en GitHub

```bash
cd refrigeracion-app/backend
git init
git add .
git commit -m "feat: backend inicial"
git remote add origin https://github.com/TU_USUARIO/refrigeracion-backend.git
git push -u origin main
```

### 2. Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) y haz login con GitHub
2. **New Project → Deploy from GitHub repo** → selecciona `refrigeracion-backend`
3. **Add Plugin → PostgreSQL** → Railway crea la DB automáticamente
4. En la sección **Variables** del servicio, agrega:
   ```
   DATABASE_URL   = (Railway lo llena automático desde PostgreSQL plugin)
   JWT_SECRET     = una-clave-segura-de-al-menos-32-caracteres
   NODE_ENV       = production
   FRONTEND_URL   = https://TU-FRONTEND.vercel.app
   ```
5. En **Settings → Start Command**: `npm start`
6. Railway despliega automáticamente. Copia la URL pública (ej: `https://refrigeracion-production.up.railway.app`)

### 3. Ejecutar migración y seed

Desde Railway CLI o la terminal web de Railway:
```bash
npm run migrate   # crea las tablas
npm run seed      # inserta equipos, tareas y programaciones reales
```

O agrega en el `package.json`:
```json
"start": "node src/db/migrate.js && node src/db/seed.js && node src/index.js"
```
Solo para el primer deploy (luego quítalo).

### 4. Configurar el Frontend

1. Abre `RefrigeracionApp.jsx`
2. Cambia la línea:
   ```js
   const API = "https://TU-BACKEND.railway.app";
   ```
   por tu URL real de Railway.

3. Despliega en **Vercel** o **Netlify**:
   - Sube el `.jsx` como un proyecto React (Vite)
   - O usa el Artifact de Claude directamente para pruebas

---

## 👤 Usuario Super Admin (pruebas)

| Campo     | Valor                  |
|-----------|------------------------|
| Nombre    | Super Admin            |
| Email     | miguelg8203@gmail.com  |
| Password  | Cielo0306*             |
| Rol       | SUPER_ADMIN            |

---

## 📋 API Endpoints

| Método | Ruta                              | Descripción                         |
|--------|-----------------------------------|-------------------------------------|
| POST   | /api/auth/login                   | Login → retorna JWT                 |
| GET    | /api/dashboard                    | Stats generales                     |
| GET    | /api/equipos                      | Lista equipos (filtro: tipo, area)  |
| GET    | /api/equipos/:id/tareas           | Tareas de un equipo con stats       |
| GET    | /api/programacion                 | Cronograma (filtros: mes, plan...) |
| PATCH  | /api/programacion/:id/completar   | Marcar como completada              |
| PATCH  | /api/programacion/:id/vencer      | Marcar como vencida                 |
| PATCH  | /api/programacion/:id/pendiente   | Reabrir tarea                       |
| GET    | /api/usuarios                     | Lista usuarios (admin only)         |
| POST   | /api/usuarios                     | Crear usuario (superadmin only)     |
| GET    | /health                           | Health check                        |

---

## 🗃️ Datos cargados del Excel

- **50 equipos**: Cavas 1–12, Muelles, Compresores, Bombas, Tanques, Salas
- **~200 tipos de tareas**: Planes MENSUAL / BIMENSUAL / TRIMESTRAL / SEMESTRAL / ANUAL
- **~1500+ programaciones**: Distribuidas Jun 2025 – Jun 2026
- **Responsable**: FABIAN (según datos originales)

---

## 📁 Estructura del proyecto

```
backend/
├── src/
│   ├── index.js          ← Servidor Express
│   ├── db/
│   │   ├── pool.js       ← Conexión PostgreSQL
│   │   ├── migrate.js    ← Crear tablas
│   │   └── seed.js       ← Datos reales del Excel
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── equipos.js
│   │   ├── programacion.js
│   │   └── usuarios.js
│   └── middleware/
│       └── auth.js       ← JWT middleware
├── package.json
├── railway.json
└── .env.example
```
