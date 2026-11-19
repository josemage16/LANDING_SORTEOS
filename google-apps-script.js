/**
 * =========================================================================================
 * GOOGLE APPS SCRIPT - LANDING SORTEOS VIDA
 * =========================================================================================
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Crea una nueva hoja de cálculo en Google Sheets (ej. "Participantes Sorteo VIDA").
 * 2. Copia el ID de la planilla desde la URL (el texto entre /d/ y /edit) y pégalo en SPREADSHEET_ID.
 * 3. En la planilla ve a: Extensiones > Apps Script.
 * 4. Borra el código existente en "Código.gs" y pega todo este archivo.
 * 5. Guarda (Ctrl+S).
 * 6. Haz clic en "Implementar" > "Nueva implementación".
 * 7. Selecciona tipo "Aplicación web":
 *    - Descripción: "Webhook Landing Sorteos VIDA"
 *    - Ejecutar como: "Yo"
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 8. Autoriza los permisos y copia la "URL de la aplicación web" (termina en /exec).
 * 9. Pega esa URL en `WEBHOOK_URL` dentro de `config.js`.
 * =========================================================================================
 */

const EMAIL_RECIPIENTS = "jge@vida.com.uy, josemage@gmail.com";
const SPREADSHEET_ID = "REEMPLAZAR_CON_EL_ID_DE_TU_GOOGLE_SHEET";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter;
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getActiveSheet();

    // Crear encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      const headers = [
        "Fecha y Hora",
        "Campaña",
        "Código Cupón",
        "Nombre",
        "Apellido",
        "Cédula (CI)",
        "Celular",
        "Email",
        "Departamento",
        "¿Es Afiliado VIDA?",
        "Bases Aceptadas",
        "Origen / UTM"
      ];
      sheet.appendRow(headers);

      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#1b3580");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    const fechaActual = Utilities.formatDate(new Date(), "America/Montevideo", "dd/MM/yyyy HH:mm:ss");
    const codigoCupon = data.codigo_cupon || ("VIDA-SRT-" + Math.floor(100000 + Math.random() * 900000));

    const row = [
      fechaActual,
      data.campana || "Gran Sorteo VIDA",
      codigoCupon,
      data.nombre || "",
      data.apellido || "",
      data.cedula || "",
      data.celular || "",
      data.email || "",
      data.departamento || "",
      data.es_afiliado || "No especificado",
      data.acepto_bases ? "Sí" : "No",
      data.origen || "Directo"
    ];

    sheet.appendRow(row);
    enviarNotificacionEmail(data, codigoCupon, fechaActual);

    return ContentService
      .createTextOutput(JSON.stringify({
        result: "success",
        message: "Participación registrada correctamente",
        codigo_cupon: codigoCupon
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

function enviarNotificacionEmail(data, codigoCupon, fechaActual) {
  const nombreCompleto = ((data.nombre || "") + " " + (data.apellido || "")).trim() || "Nuevo Participante";
  const asunto = "Nuevo Participante Sorteo VIDA: " + nombreCompleto + " (" + codigoCupon + ")";

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1b3580, #942143); color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Nuevo Registro en Sorteo VIDA</h2>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${data.campana || "Gran Sorteo VIDA"}</p>
      </div>
      <div style="padding: 24px; background: #ffffff; color: #1e293b;">
        <div style="background: #fffbf2; border: 1px dashed #c48b2e; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 12px; color: #526077; text-transform: uppercase;">Cupón Asignado</span><br>
          <strong style="font-size: 22px; color: #1b3580; letter-spacing: 1px;">${codigoCupon}</strong>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha:</td><td style="padding: 8px 0; font-weight: bold;">${fechaActual}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Nombre:</td><td style="padding: 8px 0; font-weight: bold;">${nombreCompleto}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Cédula (CI):</td><td style="padding: 8px 0; font-weight: bold;">${data.cedula || "-"}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Celular:</td><td style="padding: 8px 0; font-weight: bold;">${data.celular || "-"}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Email:</td><td style="padding: 8px 0; font-weight: bold;">${data.email || "-"}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Departamento:</td><td style="padding: 8px 0; font-weight: bold;">${data.departamento || "-"}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">¿Es Afiliado?:</td><td style="padding: 8px 0; font-weight: bold;">${data.es_afiliado || "-"}</td></tr>
        </table>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: EMAIL_RECIPIENTS,
    subject: asunto,
    htmlBody: htmlBody
  });
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "online", service: "Landing Sorteos VIDA Webhook" }))
    .setMimeType(ContentService.MimeType.JSON);
}
