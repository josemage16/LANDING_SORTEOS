/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT - SORTEO VIDA (Hoja "datos", "locales" y "fechas")
 * =========================================================================================
 * Planilla vinculada:
 * https://docs.google.com/spreadsheets/d/1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA/edit?usp=drivesdk
 *
 * INSTRUCCIONES DE INSTALACIÓN (3 minutos):
 * 1. Abrí tu Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA/edit?usp=drivesdk
 * 2. En el menú superior andá a: Extensiones > Apps Script.
 * 3. Borrá el contenido actual de "Código.gs" y pegá todo este archivo.
 * 4. Hacé clic en Guardar (Ctrl+S).
 * 5. Hacé clic en el botón azul "Implementar" > "Nueva implementación".
 * 6. En tipo elegí "Aplicación web":
 *    - Descripción: "Webhook Sorteo VIDA"
 *    - Ejecutar como: "Yo"
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 7. Hacé clic en "Implementar" y autorizá los permisos.
 * 8. Copiá la "URL de la aplicación web" (termina en /exec) y pegala en `WEBHOOK_URL`
 *    dentro del archivo `config.js` de este proyecto.
 * =========================================================================================
 */

const SPREADSHEET_ID = "1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA";
const SHEET_DATOS = "datos";
const SHEET_LOCALES = "locales";
const SHEET_FECHAS = "fechas";

/**
 * Recibe los registros del formulario y los guarda con Timestamp en la hoja "datos".
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_DATOS);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_DATOS);
    }

    // Crear encabezados si la hoja "datos" está vacía
    if (sheet.getLastRow() === 0) {
      const headers = ["Timestamp", "Local", "Nombre", "Celular"];
      sheet.appendRow(headers);

      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1b3580");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    const timestamp = Utilities.formatDate(new Date(), "America/Montevideo", "dd/MM/yyyy HH:mm:ss");

    const row = [
      timestamp,
      String(data.local || "").trim(),
      String(data.nombre || "").trim(),
      String(data.celular || "").trim()
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({
        result: "success",
        message: "Participación guardada en la hoja datos",
        timestamp: timestamp
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        result: "error",
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Endpoint GET opcional: devuelve los locales ("locales") y fechas ("fechas") en JSON.
 */
function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    const readFirstColumn = function(sheetName) {
      const sh = ss.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() === 0) return [];
      const values = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues();
      return values
        .map(function(r) { return String(r[0] || "").trim(); })
        .filter(function(v, idx) {
          if (!v) return false;
          // Omitir fila de encabezado
          if (idx === 0 && /^(locales?|comercio|pr[oó]ximo sorteo|fechas?)$/i.test(v)) return false;
          return true;
        });
    };

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "online",
        locales: readFirstColumn(SHEET_LOCALES),
        fechas: readFirstColumn(SHEET_FECHAS)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
