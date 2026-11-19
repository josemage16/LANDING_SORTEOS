# Landing Sorteos VIDA

Landing page oficial para sorteos y campañas promocionales de **VIDA Uruguay**, lista para publicar en **GitHub Pages** e integrar con **Google Sheets** + notificaciones por correo electrónico.

Repositorio: https://github.com/josemage16/LANDING_SORTEOS

## Estructura del Proyecto

- `index.html` — Estructura completa de la landing (Hero con cuenta regresiva, Premios, Pasos, Formulario con vista previa de cupón en tiempo real, Club Buena Vida, FAQ y Modales).
- `styles.css` — Sistema de diseño corporativo VIDA (`#1b3580`, `#942143`, `#e5b25d`), responsive y optimizado para impresión del cupón.
- `app.js` — Cuenta regresiva automática, formateo y validación de Cédula (CI) y celular uruguayo, vista previa en vivo del cupón, generación de código único `VIDA-SRT-XXXXXX`, confeti y envío a webhook.
- `config.js` — Configuración centralizada de campaña (nombre, fecha del sorteo, contacto y URL de Google Sheets / Apps Script).
- `google-apps-script.js` — Script para Google Sheets que guarda cada participación y envía alerta por email.
- `push.bat` — Script de sincronización rápida con GitHub (`main`).
- `assets/` — Logos e imágenes corporativas de VIDA y Club Buena Vida.

## Cómo Personalizar una Nueva Campaña

1. Abrí `config.js` y actualizá:
   - `CAMPAIGN_NAME`
   - `DRAW_DATE_ISO` y `DRAW_DATE_LABEL`
   - `SPREADSHEET_URL` y `WEBHOOK_URL`
2. Editá los títulos y descripciones de los 3 premios en `index.html` (sección `#premios`).

## Conectar Google Sheets (Opcional)

1. Creá una planilla en Google Sheets y copiá su ID desde la URL (`/d/<ID>/edit`).
2. Abrí **Extensiones > Apps Script** y pegá el contenido de `google-apps-script.js`, reemplazando `SPREADSHEET_ID`.
3. Implementá como **Aplicación web** con acceso **Cualquier usuario (Anyone)**.
4. Copiá la URL `/exec` generada y pegala en `WEBHOOK_URL` dentro de `config.js`.

## Publicar en GitHub Pages

1. Entrá a https://github.com/josemage16/LANDING_SORTEOS/settings/pages
2. En **Build and deployment > Source**, seleccioná **Deploy from a branch**.
3. Elegí la rama `main` y la carpeta `/ (root)`, luego **Save**.
4. Tu landing quedará publicada en `https://josemage16.github.io/LANDING_SORTEOS/`.

## Sincronizar Cambios a GitHub

Ejecutá `push.bat` (doble clic) para hacer `git add`, `git commit` y `git push origin main`.
