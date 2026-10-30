# DH CRM

Interfaz propia en **Material Design 3** sobre el **Zoho CRM** de DH Softbri (uso interno de Jonatan). Zoho es la fuente de verdad: los datos, respaldos y la seguridad viven allá. Esta app solo aporta las pantallas del día a día: pipeline, alta de clientes, ficha con notas, tareas y reuniones, y agenda.

Por qué no es un CRM desde cero: Zoho One cuesta 250 MXN/mes, así que construir y mantener backend, base de datos y respaldos propios nunca se pagaría. **No agregues backend ni base de datos propios** salvo que Jonatan lo pida explícitamente.

## Comandos

```bash
npm install          # dependencias
npm start            # dev server en http://localhost:4200
npm run build        # build de producción → dist/dh-crm/browser
npm run build:demo   # build con rutas hash y base relativa → dist-demo (para publicar la demo)
```

Para verificar un cambio: `npm run build` debe terminar sin errores ni warnings de presupuesto, y después hay que probar el flujo en el navegador en **modo demo**. Todavía no hay pruebas unitarias.

## Stack y convenciones

- **Angular 22**, zoneless (sin zone.js), solo componentes standalone, control flow nuevo (`@if`, `@for`, `@let`), `input()` y signals para el estado. No uses `NgModule`, `*ngIf` ni `*ngFor`.
- **Angular Material 22 con tema M3.** Estiliza siempre con los tokens del sistema (`var(--mat-sys-primary)`, `--mat-sys-surface-container-low`, `--mat-sys-title-medium`, `--mat-sys-corner-large`, etc.); no escribas colores fijos para la UI. El tema se genera en `src/_theme-colors.scss` y se aplica en `src/styles.scss`.
- **Marca DH Softbri:** Blue Steel `#0265CF` (primario), Deep Blue `#01092E` (terciario), True White `#F1F8FD`. La fuente de la marca es Gilroy; en la app se usa Plus Jakarta Sans como sustituto libre. Los logos están en `public/`.
- **Íconos:** Material Symbols Outlined (`<mat-icon>nombre</mat-icon>`; el font set por defecto se registra en `app.ts`).
- **Botones M3:** `mat-flat-button` (filled), `matButton="tonal"`, `mat-stroked-button` (outlined), `mat-button` (text), `mat-fab` / `mat-fab extended`.
- **Formularios:** Reactive Forms con `NonNullableFormBuilder`. Los campos usan apariencia `outline` por defecto (definida en `app.config.ts`).
- **Idioma:** toda la UI está en **español de México**. `LOCALE_ID` y el datepicker usan `es-MX`. Los textos deben ser directos y cercanos, como pide el tono de la marca.
- **Responsive:** el breakpoint es 840px. Por encima se muestra un navigation rail a la izquierda; por debajo, una barra de navegación inferior con FAB extendido. Revisa cada pantalla en ambos tamaños.
- **Estilos:** prettier (`.prettierrc`), 2 espacios, ancho 100. Los SCSS de componentes tienen presupuesto de 8 kB (advertencia) y 16 kB (error).

## Arquitectura

```
src/app/
  app.settings.ts        Configuración: Client ID de Zoho, centro de datos, módulo y campo de estatus.
                         Con clientId vacío la app arranca en MODO DEMO.
  app.config.ts          Providers. Elige DemoBackend o ZohoBackend según isDemoMode().
  app.routes.ts          Rutas lazy + authGuard.
  core/
    crm-backend.ts       Clase abstracta CrmBackend: el contrato que usan todas las pantallas.
    zoho-backend.ts      Implementación real con fetch a la API v8 de Zoho.
    demo-backend.ts      Implementación en memoria + localStorage, con datos de ejemplo.
    zoho-auth.service.ts OAuth implícito para "Client-based Applications"; el token vive en sessionStorage.
    crm-store.ts         Estado compartido con signals (clientes, estatus) y toasts de error y éxito.
    models.ts            Modelos de dominio (Client, Note, CrmTask, Meeting).
  layout/shell.*         Navegación rail/bottom bar, top bar, FAB para nuevo cliente.
  pages/                 pipeline (kanban con CDK drag&drop), clients, client-detail, agenda, login, auth-callback.
  dialogs/               new-client, task, meeting.
  shared/ui.ts           Utilidades de UI: iniciales, color por estatus, WhatsApp, fechas.
```

**Regla clave:** cada operación de datos nueva se agrega primero a `CrmBackend` y luego se implementa en **los dos** backends (`ZohoBackend` y `DemoBackend`). Las pantallas solo deben hablar con `CrmBackend` o con `CrmStore`, nunca directo con Zoho.

## Zoho CRM (API v8)

- El navegador llama directo a `${api_domain}/crm/v8/...` con el header `Authorization: Zoho-oauthtoken <token>`. Zoho habilita CORS para los clientes JS registrados.
- **Scopes:** `ZohoCRM.modules.ALL`, `ZohoCRM.settings.fields.READ`, `ZohoCRM.coql.READ`, `ZohoCRM.users.READ`.
- **Clientes:** módulo `Leads` por defecto (configurable). Campos: `First_Name`, `Last_Name` (obligatorio), `Company` (obligatorio), `Email`, `Phone`, `Lead_Status`, `Lead_Source`, `Description`. En v8, `fields` es obligatorio en los GET de listas.
- **Estatus / columnas del pipeline:** se leen los `pick_list_values` del campo de estatus vía `settings/fields?module=Leads`.
- **Notas:** `GET/POST {Module}/{id}/Notes` con `Note_Content`.
- **Tareas:** módulo `Tasks` (`Subject`, `Due_Date` yyyy-MM-dd, `Status`, `Priority`), relacionadas con `What_Id: {id}` + `$se_module`. Completar = `Status: 'Completed'`.
- **Reuniones:** módulo `Events` (`Event_Title`, `Start_DateTime`, `End_DateTime` en ISO con zona horaria, `Venue`), relacionadas igual que las tareas.
- **Consultas filtradas:** COQL (`POST coql`). Si COQL falla, hay un respaldo que trae registros recientes y filtra en el cliente.
- **Escrituras:** usan `{ data: [record] }`. Zoho responde 200 incluso cuando un registro falla, así que hay que revisar `data[0].status` (ya lo hace `ZohoBackend.write`).
- **Límites:** Zoho One tiene 50,000 créditos diarios más 1,000 por licencia, y 20 llamadas concurrentes. No hagas llamadas en loops por registro; usa COQL o listas.

## Pendiente de validar con datos reales

Todo se ha probado solo en modo demo. En la primera conexión real hay que revisar:
1. Si el layout de Leads tiene campos obligatorios personalizados (Zoho rechaza el alta y la app muestra el `api_name`).
2. Si COQL acepta `where What_Id = '<id>'` en Tasks y Events (si no, entra el respaldo).
3. Que la zona horaria de las reuniones se vea correcta en Zoho Calendar. Playa del Carmen es UTC-5 todo el año.

## Despliegue

Cloudflare Pages: build `npm run build`, salida `dist/dh-crm/browser`; `public/_redirects` ya incluye el fallback SPA. Para Vercel está `vercel.json`. El dominio sugerido es `crm.dhsoftbri.com`, y debe estar registrado como JavaScript Domain y Redirect URI (`/auth/callback`) en api-console.zoho.com.

## Ideas para la siguiente fase

- Editar los datos del cliente desde la ficha.
- Búsqueda contra Zoho (`{Module}/search?word=`) cuando haya más de 1,000 registros.
- Modo oscuro (`color-scheme: light dark` en `styles.scss`).
- Aligerar la fuente de íconos (hoy pesa ~4 MB) cargando solo los íconos usados desde Google Fonts con `icon_names`.
- Registrar llamadas en un clic.
