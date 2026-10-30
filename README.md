# DH CRM

Interfaz propia en **Material Design 3** sobre tu **Zoho CRM**. Los datos, respaldos y la seguridad se quedan en Zoho; esta app solo te da las pantallas que usas a diario:

- **Pipeline**: tablero kanban por estatus. Arrastras una tarjeta (o usas el menú ⋮) y el estatus se actualiza en Zoho.
- **Clientes**: lista con búsqueda y filtro por estatus, y botón para agregar un cliente nuevo.
- **Ficha del cliente**: cambio de estatus, accesos directos para llamar, mandar WhatsApp o correo, y pestañas de **Notas**, **Tareas** y **Reuniones**.
- **Agenda**: tus tareas pendientes (vencidas, de hoy, próximas) y las reuniones que vienen.

Stack: Angular 22 + Angular Material (M3), tema generado con tus colores de marca (Blue Steel `#0265CF` y Deep Blue `#01092E`). No usa backend propio: el navegador habla directo con la API v8 de Zoho.

---

## 0. Empezar en tu PC (una sola vez)

1. Ten instalados **Git** (https://git-scm.com/download/win) y **Node.js 22 o 24** (https://nodejs.org).
2. Haz doble clic en **`conectar-repo.cmd`**. Enlaza esta carpeta con https://github.com/dhsoftbri-ai/CRM-DH e instala las dependencias.
3. Abre una terminal en esta carpeta y escribe `claude` para trabajar con Claude Code. El archivo `CLAUDE.md` ya le da todo el contexto del proyecto.

## 1. Probarla en modo demo (sin Zoho)

```bash
npm install
npm start
```

Abre http://localhost:4200. Mientras `clientId` esté vacío en `src/app/app.settings.ts`, la app usa datos de ejemplo que se guardan en tu navegador. Para reiniciarlos usa el menú de cuenta → *Restablecer datos de ejemplo*.

## 2. Conectarla a tu Zoho CRM

1. Entra a https://api-console.zoho.com → **Add Client** → **Client-based Applications**.
2. Llena el registro:
   - **Homepage URL**: `https://crm.dhsoftbri.com` (o el dominio que vayas a usar)
   - **Authorized Redirect URIs**: `https://crm.dhsoftbri.com/auth/callback` y `http://localhost:4200/auth/callback`
   - **JavaScript Domain**: `https://crm.dhsoftbri.com` y `http://localhost:4200`
3. Copia el **Client ID** en `src/app/app.settings.ts` → `zoho.clientId`.
4. Si tu cuenta no está en el centro de datos de EE. UU. (`accounts.zoho.com`), cambia `accountsUrl`.
5. `npm start`, pulsa **Conectar con Zoho** y autoriza el acceso.

**Qué módulo usa:** por defecto los clientes son **Prospectos (Leads)** y las columnas del pipeline salen del campo **Estado del prospecto (`Lead_Status`)**. Para tener columnas como "Nuevo → Contactado → Propuesta enviada → Ganado", edita ese campo en Zoho (Configuración → Módulos y campos → Prospectos). Si prefieres otro módulo o campo, cámbialo en `crm.clientsModule` y `crm.statusField`.

**Sesión:** el token vive solo en la pestaña (sessionStorage) y dura alrededor de una hora. Cuando vence, la app te regresa a Zoho y vuelve sola, sin pedirte permiso otra vez.

## 3. Publicarla en tu dominio (gratis)

**Cloudflare Pages** (recomendado):
- Build command: `npm run build`
- Output directory: `dist/dh-crm/browser`
- Agrega tu dominio personalizado (por ejemplo `crm.dhsoftbri.com`).
- El archivo `public/_redirects` ya hace que las rutas funcionen al recargar.

**Vercel**: el mismo build; `vercel.json` ya incluye la regla de rutas.

**Instalarla en el celular:** abre la URL en Chrome o Safari y elige *Agregar a pantalla de inicio*. Se abre como app, con tu ícono.

## 4. Qué revisar en la primera prueba con datos reales

- **Campos obligatorios:** si tu layout de Prospectos tiene campos obligatorios personalizados, Zoho rechazará el alta y la app mostrará el nombre del campo. Agrégalo al formulario en `dialogs/new-client.dialog.ts` y en `createClient` de `core/zoho-backend.ts`.
- **Tareas y reuniones por cliente:** se consultan con COQL filtrando por `What_Id`. Si tu cuenta no acepta ese filtro, la app trae las últimas 200 y filtra en el navegador (respaldo automático).
- **Volumen:** la lista carga hasta 1,000 clientes, ordenados por última modificación.

## Estructura

```
src/app/
  app.settings.ts        ← configuración (Client ID, módulo, campo de estatus)
  core/
    zoho-auth.service.ts ← OAuth de Zoho (flujo para apps de navegador)
    zoho-backend.ts      ← llamadas a la API v8 (Leads, Notes, Tasks, Events, COQL)
    demo-backend.ts      ← datos de ejemplo para el modo demo
    crm-store.ts         ← estado compartido (clientes y estatus)
  layout/shell.*         ← navigation rail (escritorio) / barra inferior (móvil)
  pages/                 ← pipeline, clientes, ficha, agenda, login
  dialogs/               ← nuevo cliente, nueva tarea, agendar reunión
src/_theme-colors.scss   ← paletas M3 generadas desde tu color de marca
```

## Ideas para la siguiente fase

- Editar los datos del cliente desde la ficha.
- Búsqueda contra Zoho cuando pases de 1,000 registros.
- Modo oscuro: cambia `color-scheme: light` por `light dark` en `src/styles.scss`.
- Aligerar los íconos: la fuente completa de Material Symbols pesa ~4 MB; se puede cargar desde Google Fonts solo con los íconos que se usan (`&icon_names=...`).
- Convertir una tarea en reunión, o registrar una llamada en un clic.
