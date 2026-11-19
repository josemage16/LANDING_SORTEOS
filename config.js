/**
 * ==========================================================================
 * CONFIGURACIÓN GENERAL - LANDING SORTEOS VIDA
 * ==========================================================================
 * Edita este archivo para actualizar la fecha del sorteo, los premios,
 * los datos de contacto o la conexión con Google Sheets sin tocar el resto
 * del código.
 */

const SORTEO_CONFIG = {
  // Nombre de la campaña / sorteo actual (se guarda también en Google Sheets)
  CAMPAIGN_NAME: "Gran Sorteo VIDA 2026",

  // Fecha y hora de cierre / realización del sorteo (formato ISO con zona horaria de Uruguay -03:00)
  // El contador regresivo se calcula automáticamente con base en esta fecha.
  DRAW_DATE_ISO: "2026-12-20T18:00:00-03:00",
  DRAW_DATE_LABEL: "20 de diciembre de 2026 · 18:00 hs",

  // Prefijo del código de cupón digital generado para cada participante
  COUPON_PREFIX: "VIDA-SRT",

  // Teléfono y WhatsApp oficial de contacto
  PHONE_DISPLAY: "0800 8320",
  PHONE_LINK: "tel:08008320",
  WHATSAPP_NUMBER: "59822043739",
  WHATSAPP_MESSAGE: "Hola, quisiera consultar sobre el Gran Sorteo VIDA.",

  // ========================================================================
  // INTEGRACIÓN GOOGLE SHEETS & EMAIL (Google Apps Script)
  // ========================================================================
  // 1. Crea una hoja en Google Sheets para tus participantes.
  // 2. Sigue los pasos en `google-apps-script.js` y `README.md`.
  // 3. Pega aquí la URL de la planilla y la URL del Webhook (/exec).
  SPREADSHEET_URL: "",
  WEBHOOK_URL: "",

  // Correos destinatarios de alertas (referencia)
  EMAILS: ["jge@vida.com.uy", "josemage@gmail.com"]
};

// Exportar globalmente
window.SORTEO_CONFIG = SORTEO_CONFIG;
