const SPREADSHEET_ID = "1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA";
const SHEET_DATOS = "datos";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheets().find(function(s) {
      return s.getName().trim().toLowerCase() === SHEET_DATOS;
    });
    if (!sheet) sheet = ss.insertSheet(SHEET_DATOS);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Local", "Nombre", "Celular"]);
      sheet.getRange(1, 1, 1, 4).setBackground("#1b3580").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    const ts = Utilities.formatDate(new Date(), "America/Montevideo", "dd/MM/yyyy HH:mm:ss");
    sheet.appendRow([ts, String(data.local || "").trim(), String(data.nombre || "").trim(), String(data.celular || "").trim()]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success", timestamp: ts })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
