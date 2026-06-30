# Calendario de turnos

Calendario semanal (lunes a viernes) para gestionar turnos compartidos entre vos y tu compañera, con persistencia real en base de datos y sincronización automática entre ambas vistas.

## Funcionalidad

- Vista semanal con navegación a semanas anteriores/siguientes.
- Estados por turno: Disponible (azul, 📭), Ofrecido (rojo, ⛔️), Agendado (verde, ✅).
- Al marcar "Ofrecido" o "Agendado" se solicita el legajo del cliente, visible debajo del estado.
- Reset automático: todo turno en "Ofrecido" que no se cambie antes de las 19:00 (hora del servidor) vuelve a "Disponible".
- Los días pasados quedan bloqueados para edición.
- **Los cambios que hace una persona se reflejan en la vista de la otra** porque ambas leen y escriben sobre la misma base de datos (no en el navegador local). La app actualiza la vista automáticamente cada 8 segundos.

## Cómo hacer el deploy en Vercel

### 1. Subir el proyecto a un repositorio de GitHub
Si no tenés uno, creá un repo nuevo y subí esta carpeta completa.

### 2. Crear el proyecto en Vercel
- Entrá a [vercel.com](https://vercel.com) e iniciá sesión.
- "Add new" → "Project" → importá el repositorio.
- Vercel detecta automáticamente que es Next.js, no hace falta tocar la configuración de build.

### 3. Crear la base de datos (Vercel KV)
Esto es lo que permite que los datos sean compartidos entre vos y tu compañera, en vez de guardarse solo en tu navegador.

- Dentro del proyecto en Vercel, ir a la pestaña **Storage**.
- "Create Database" → elegir **KV** (Redis).
- Seguir el asistente y conectarla al proyecto. Vercel agrega automáticamente las variables de entorno necesarias (`KV_URL`, `KV_REST_API_URL`, etc.) — no hay que configurarlas a mano.

### 4. Redeploy
Una vez conectada la base de datos, hacé un redeploy (Vercel suele pedirlo automáticamente, o lo podés forzar desde la pestaña Deployments → "Redeploy").

### 5. Listo
Compartí la URL que te da Vercel (algo como `https://calendario-turnos.vercel.app`) con tu compañera. Ambas pueden abrirla al mismo tiempo desde sus propios dispositivos y ver los mismos turnos actualizados.

## Desarrollo local (opcional)

```bash
npm install
npm run dev
```

Para probar localmente con la base de datos real, hay que copiar las variables de entorno desde Vercel (Project Settings → Environment Variables) a un archivo `.env.local` en la raíz del proyecto.
