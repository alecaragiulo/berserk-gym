# ⚔ Iron Berserk — Gym Tracker

> *"Even if we wander through the darkness, even if we are swallowed by the night — keep moving forward."*

## Stack

- **Next.js 14** — App Router + Server Components
- **Supabase** — PostgreSQL + Auth + Realtime + RLS
- **Zustand** — Estado del cliente (sesión activa)
- **TanStack Query** — Cache de server state
- **Tailwind CSS** — Estilo con tokens Berserk

---

## Setup en 5 pasos

### 1. Clonar e instalar
```bash
git clone <repo>
cd iron-berserk
npm install
```

### 2. Crear proyecto en Supabase
1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo
2. Guardá la **Project URL** y la **anon key** (las vas a necesitar en el paso 3)

### 3. Variables de entorno
```bash
cp .env.local.example .env.local
```
Editá `.env.local` con tus keys de Supabase.

### 4. Correr la migración
1. Abrí tu proyecto en Supabase
2. Andá a **SQL Editor**
3. Pegá y ejecutá el contenido de `supabase/migrations/001_initial_schema.sql`

Esto crea todas las tablas, índices, triggers, RLS policies y el seed de ejercicios.

### 5. Levantar el proyecto
```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
src/
├── app/
│   ├── dashboard/        # Dashboard principal (Server Component)
│   ├── workout/          # Sesión activa de entrenamiento
│   ├── routines/         # Feed social + crear rutinas
│   ├── progress/         # Historial y gráficos
│   └── login/            # Auth con Supabase
├── components/
│   ├── ui/               # Componentes base (botones, inputs)
│   ├── workout/          # ExerciseList, SetLogger, etc.
│   ├── routines/         # RoutineCard, RoutineFeed, etc.
│   └── layout/           # Sidebar, Header
├── lib/
│   ├── supabase/         # Clientes browser y server
│   ├── queries/          # Data access layer (server-side)
│   └── store/            # Zustand stores (cliente)
├── hooks/                # Custom hooks
├── types/                # TypeScript types del schema
└── middleware.ts         # Auth guard de rutas
```

---

## Decisiones de arquitectura

**Server Components por defecto** — Las páginas fetchean datos en el servidor. El cliente solo recibe HTML + datos ya listos. Cero waterfalls.

**RLS en Supabase** — Los permisos viven en la DB, no en el API. Si alguien bypassea el front, Supabase igual rechaza la query.

**Zustand solo para sesión activa** — El estado de un workout en curso vive en el cliente (feedback inmediato al loggear un set). Todo lo demás se fetchea del servidor.

**subscribers_count desnormalizado** — El feed de rutinas es muy leído. En vez de `COUNT(*)` por rutina, un trigger lo mantiene actualizado con costo O(1) por suscripción.
