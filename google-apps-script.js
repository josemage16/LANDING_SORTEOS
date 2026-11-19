const SPREADSHEET_ID = "1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA";
const SHEET_DATOS = "datos";
const SHEET_LOCALES = "locales";
const SHEET_FECHAS = "fechas";

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
    let sheet = ss.getSheets().find(function(s) {
      return s.getName().trim().toLowerCase() === SHEET_DATOS.toLowerCase();
    });
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_DATOS);
    }

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
    sheet.appendRow([
      timestamp,
      String(data.local || "").trim(),
      String(data.nombre || "").trim(),
      String(data.celular || "").trim()
    ]);

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

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    const readFirstColumn = function(sheetName) {
      const sh = ss.getSheets().find(function(s) {
        return s.getName().trim().toLowerCase() === sheetName.toLowerCase();
      });
      if (!sh || sh.getLastRow() === 0) return [];
      const values = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues();
      return values
        .map(function(r) { return String(r[0] || "").trim(); })
        .filter(function(v, idx) {
          if (!v) return false;
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
