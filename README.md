# Landing Sorteo VIDA

Landing page oficial del **Sorteo VIDA** (orden de compra valor **$3.000** en tu comercio de confianza) con el look & feel de `www.vida.com.uy`, integrada en tiempo real con Google Sheets y lista para **GitHub Pages**.

- **Repositorio GitHub:** https://github.com/josemage16/LANDING_SORTEOS
- **Google Sheet vinculada:** https://docs.google.com/spreadsheets/d/1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA/edit?usp=drivesdk

## Integración con Google Sheets

| Hoja | Función | Estado |
| --- | --- | --- |
| `locales` | Alimenta dinámicamente el desplegable **Local** del formulario. | **Activo automáticamente** en vivo desde Google Sheets. |
| `fechas` | Alimenta dinámicamente la **cuenta regresiva** hasta el próximo sorteo. | **Activo automáticamente** en vivo desde Google Sheets. |
| `datos` | Guarda **Timestamp, Local, Nombre y Celular** de cada participante. | Requiere desplegar `google-apps-script.js` y pegar la URL `/exec` en `config.js`. |

## Cómo activar el guardado en la hoja `datos` (3 minutos)

1. Abrí tu planilla: https://docs.google.com/spreadsheets/d/1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA/edit?usp=drivesdk
2. Andá a **Extensiones > Apps Script**.
3. Borrá el código por defecto en `Código.gs` y pegá todo el contenido de `google-apps-script.js`.
4. Guardá (`Ctrl+S`).
5. Hacé clic en **Implementar > Nueva implementación** → Tipo: **Aplicación web**:
   - **Ejecutar como:** `Yo`
   - **Quién tiene acceso:** `Cualquier usuario (Anyone)`
6. Autorizá los permisos y copiá la **URL de la aplicación web** (termina en `/exec`).
7. Pegá esa URL en `WEBHOOK_URL` dentro de `config.js` y ejecutá `push.bat` para sincronizar con GitHub.

## Publicar en GitHub Pages

1. Entrá a https://github.com/josemage16/LANDING_SORTEOS/settings/pages
2. En **Source**, seleccioná **Deploy from a branch** → rama `main` → `/ (root)` → **Save**.
3. La landing quedará online en `https://josemage16.github.io/LANDING_SORTEOS/`.
