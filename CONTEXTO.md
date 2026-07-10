# CONTEXTO.md — Horarios para meets

## 1. Stack Tecnológico
- **Framework:** Next.js 14.2.35 (App Router)
- **UI:** React 18, estilos inline + `globals.css` con variables CSS
- **Base de datos:** Upstash Redis (`@upstash/redis ^1.34.3`) vía Vercel Marketplace
- **Deploy:** Vercel (rama `main` → producción automática)
- **Sin Tailwind**, sin librería de componentes — todo CSS custom con variables

## 2. Arquitectura y Estructura

```
app/
├── layout.js              # Importa globals.css + script anti-FOUC para dark mode
├── globals.css            # Variables CSS de tema (light/dark), media queries responsive
├── page.js                # Único componente cliente ("use client"), toda la UI vive acá
└── api/
    ├── turnos/[date]/route.js    # GET y POST del estado de los slots de un día
    └── bloqueo/[date]/route.js   # GET y POST del bloqueo de un día completo
```

- **Estado compartido:** Upstash Redis. Claves: `turnos:YYYY-MM-DD` y `bloqueo:YYYY-MM-DD`
- **Sincronización:** polling cada 8 segundos (fetch silencioso a la API)
- **Estado local:** dark/light mode en `localStorage` de cada navegador (no va a Redis)
- **Reset de "Ofrecido":** se aplica en el servidor al momento del GET, comparando `offeredAt` contra el último umbral de las 19:00

## 3. Estado Actual
- App desplegada en Vercel y funcionando. Vista semanal L–V con 7 horarios fijos (9:30–16:30). Tres estados por slot (📭 Disponible, ⛔️ Ofrecido, ✅ Agendado) con legajo del cliente en Ofrecido y Agendado. Bloqueo de días completos con motivo (🚫/❇️), filtro por estado, botón "Ir a hoy", responsive (5→2→1 col), dark/light mode con switch ☀️/🌙.

## 4. Próximos Pasos / Pendientes

### Correcciones urgentes (acordadas, no implementadas aún)
- **Bug dark mode:** switch aparece en posición incorrecta al cargar; no persiste correctamente entre sesiones. Fix: corregir inicialización en `ThemeSwitch` y script anti-FOUC en `layout.js`
- **Bug reset 19:00:** el reset solo corre cuando alguien hace un GET a la API, no automáticamente. Fix: crear Vercel Cron Job (`app/api/cron/reset/route.js` + `vercel.json`) que corra a las 19:00 todos los días

### Nuevas features (orden acordado)
1. **Login con Google** — primero, como base de seguridad. Solo cuentas habilitadas por el admin (lista blanca de emails). Bloquea el acceso a la URL a usuarios no autorizados
2. **Google Calendar** — integración OAuth del usuario logueado para: (a) agendar meets de 30 min (capacitaciones) o 15 min (kick off) con formato `[Legajo + nombre] - [Tipo de reunión]`, (b) mostrar advertencia en slots "Disponible" si hay algo agendado en Calendar a esa hora
3. **Auditoría de cambios** — registrar quién modificó cada slot y desde qué estado, mostrarlo en la card

## 5. Reglas del Proyecto

### Lógica de negocio
- **Reset de "Ofrecido":** se basa en el reloj actual, no en la fecha del slot. Cualquier slot ofrecido cuyo `offeredAt` sea anterior al último umbral de las 19:00 (hoy si ya pasaron, ayer si no) vuelve a "Disponible", sin importar si el slot es de hoy, mañana o la semana próxima
- **Días pasados:** solo lectura, no se pueden editar ni bloquear
- **Dark mode:** guardado en `localStorage` por usuario (preferencia individual, no compartida)
- **Slots del día bloqueado:** se ocultan completamente; la columna muestra solo el motivo y el ícono 🚫

### Convenciones de código
- Todo el código de UI en `app/page.js` (un solo archivo cliente); no fragmentar en múltiples componentes por ahora salvo que la feature lo exija
- Estilos inline en JSX + clases CSS solo para responsive y transiciones
- Las API routes validan inputs y devuelven errores con status HTTP apropiados
- Antes de implementar cualquier cambio: explicar qué se va a modificar y en qué archivos, y esperar confirmación del usuario

### Convenciones de deploy
- Nunca pushear directo a `main`
- Cada feature en su propia rama → preview deploy en Vercel → merge a `main` solo tras validar
- El `.zip` entregado nunca incluye `node_modules`, `.next`, `.env.local` ni `package-lock.json`
