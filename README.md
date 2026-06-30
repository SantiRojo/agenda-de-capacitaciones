# Calendario de turnos

Calendario semanal (lunes a viernes) para gestionar turnos compartidos entre vos y tu compañera, con persistencia real en base de datos y sincronización automática entre ambas vistas.

## Funcionalidad

- Vista semanal con navegación a semanas anteriores/siguientes.
- Estados por turno: Disponible (azul, 📭), Ofrecido (rojo, ⛔️), Agendado (verde, ✅).
- Al marcar "Ofrecido" o "Agendado" se solicita el legajo del cliente, visible debajo del estado.
- Reset automático: todo turno en "Ofrecido" que no se cambie antes de las 19:00 (hora del servidor) vuelve a "Disponible".
- Los días pasados quedan bloqueados para edición.
- **Los cambios que hace una persona se reflejan en la vista de la otra** porque ambas leen y escriben sobre la misma base de datos (no en el navegador local). La app actualiza la vista automáticamente cada 8 segundos.
- Diseño responsive: en pantallas chicas la grilla de 5 días pasa a 2 columnas, y a 1 columna en celulares angostos.
- Modo oscuro automático, según la preferencia del sistema operativo/navegador (no requiere configuración manual).

## Base de datos: Upstash Redis (vía Vercel Marketplace)

Nota: Vercel discontinuó su producto "Vercel KV" (la antigua pestaña "Storage" ya no existe con ese nombre). Ahora la base de datos se instala desde el **Marketplace** de Vercel, usando Upstash Redis, y este proyecto ya está armado para funcionar con esa integración.

## Cómo hacer el deploy en Vercel

### 1. Subir el proyecto a un repositorio de GitHub
Si no tenés uno, creá un repo nuevo y subí esta carpeta completa.

### 2. Crear el proyecto en Vercel
- Entrá a vercel.com e iniciá sesión.
- "Add new" → "Project" → importá el repositorio.
- Vercel detecta automáticamente que es Next.js, no hace falta tocar la configuración de build. Por ahora podés dejar que el primer deploy falle o quede incompleto (todavía no tenemos la base de datos conectada).

### 3. Instalar Upstash Redis desde el Marketplace
- Dentro del proyecto en Vercel, buscá la pestaña **Marketplace** (o "Integrations", según la versión del dashboard) en el menú superior o lateral.
- Buscá **Upstash** y elegí la opción de **Redis**.
- Hacé clic en "Install" o "Add Integration".
- Te va a pedir conectar una cuenta de Upstash (podés dejar que Vercel la gestione automáticamente, no hace falta crear una cuenta aparte).
- Elegí crear una base nueva (Redis database), seleccioná la región más cercana, y conectala a este proyecto específico.
- Al finalizar, Vercel inyecta automáticamente las variables de entorno necesarias (KV_REST_API_URL y KV_REST_API_TOKEN, o UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN según la versión) — no hace falta copiarlas a mano.

### 4. Redeploy
Una vez instalada la integración, hacé un redeploy desde la pestaña Deployments → botón "Redeploy" en el último deployment. Esto asegura que la app arranque con las variables de entorno ya disponibles.

### 5. Listo
Compartí la URL que te da Vercel (algo como https://calendario-turnos.vercel.app) con tu compañera. Ambas pueden abrirla al mismo tiempo desde sus propios dispositivos y ver los mismos turnos actualizados.

## Si no encontrás "Marketplace" en el menú

Las opciones de Vercel cambian de nombre con cierta frecuencia. Si no aparece como "Marketplace":
- Buscá "Integrations" en la configuración del proyecto (Project Settings).
- O entrá directamente a vercel.com/marketplace/upstash y seguí el flujo de instalación desde ahí, eligiendo tu proyecto cuando te lo pida.

## Desarrollo local (opcional)

```bash
npm install
npm run dev
```

Para probar localmente con la base de datos real:

```bash
vercel link
vercel env pull .env.local
```

Esto descarga las variables de entorno reales del proyecto (las que generó la integración de Upstash) a un archivo .env.local, necesario para que Redis.fromEnv() funcione en tu máquina.
