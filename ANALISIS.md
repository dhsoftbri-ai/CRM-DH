# Análisis inicial de DH CRM

Revisión: 29 de octubre de 2026.
Repositorio: https://github.com/dhsoftbri-ai/CRM-DH

## Estado actual

Aplicación frontend Angular 22 con Angular Material, componentes standalone,
rutas lazy y estado mediante signals. Incluye pipeline kanban, listado y alta
de clientes, ficha con notas, tareas y reuniones, y agenda.

Las pantallas utilizan el contrato `CrmBackend` y el estado `CrmStore`.
Existen dos implementaciones: `DemoBackend`, con persistencia en localStorage,
y `ZohoBackend`, con llamadas directas a Zoho. No hay backend ni base de datos
propios. El Client ID está vacío: la configuración actual activa el modo demo.

## Comprobaciones realizadas

- `npm ci --no-audit --no-fund`: instalación completada.
- `npm run build`: compilación de producción correcta, sin advertencias de
  presupuesto. Bundle inicial: 525.16 kB; transferencia estimada: 129.54 kB.
- Búsqueda de patrones de credenciales en archivos fuente: no se encontraron
  tokens GitHub, claves privadas ni identificadores de acceso AWS de los
  patrones revisados. Esto no constituye una auditoría completa de secretos.
- No se encontraron pruebas unitarias existentes. No se verificaron en esta
  revisión los flujos de navegador ni una conexión real con Zoho.

## Hallazgos y próximos pasos

1. **Validación OAuth incompleta.** En `zoho-auth.service.ts`, `handleCallback`
   solo rechaza `state` cuando existen tanto el valor guardado como el recibido
   y son distintos. Si falta alguno, acepta el callback. Antes de usar datos
   reales debe exigir ambos y coincidencia exacta, con pruebas para valores
   ausentes, incorrectos y reutilizados.
2. **Dominio API recibido sin validación.** El mismo callback acepta `api_domain`
   y `ZohoBackend.api` envía allí el token de autorización. Conviene restringir
   el dominio a los servidores HTTPS de Zoho admitidos por la configuración.
3. **Integración real pendiente.** Verificar campos obligatorios, relaciones de
   tareas y reuniones con Leads, consultas COQL y zonas horarias en una cuenta
   de prueba antes de usar información de producción.
4. **Listas con límites.** Clientes intenta cargar hasta cinco páginas de 200;
   tareas y reuniones tienen límites de 200 y 100 en consultas COQL. Verificar
   paginación con datos reales e incorporar búsqueda y carga adicional para
   evitar listas incompletas.
5. **Pruebas automatizadas pendientes.** Priorizar autenticación, contratos de
   ambos backends y reversión del cambio optimista de estatus ante errores.
6. **Script de conexión heredado.** `conectar-repo.ps1` ejecuta un reset mixto
   contra `origin/main`; no debe usarse como sincronización cotidiana porque
   puede mover la rama local y quitar archivos del staging. Con el repositorio
   ya conectado, utilizar el flujo habitual de Git.

## Preparación del repositorio

Se actualizaron README y script de conexión al destino nuevo. Se añadieron
exclusiones de archivos `.env` y claves privadas a `.gitignore`. Dependencias,
cachés y compilaciones permanecen excluidas. No se modificó la lógica de la
aplicación durante esta revisión.
