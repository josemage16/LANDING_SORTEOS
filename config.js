/**
 * ==========================================================================
 * CONFIGURACIÓN GENERAL - LANDING SORTEO VIDA
 * ==========================================================================
 * Planilla de Google Sheets vinculada:
 * https://docs.google.com/spreadsheets/d/1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA/edit?usp=drivesdk
 *
 * - Hoja "locales" -> Alimenta dinámicamente el desplegable de Locales
 * - Hoja "fechas"  -> Alimenta dinámicamente la cuenta regresiva del próximo sorteo
 * - Hoja "datos"   -> Guarda Local, Nombre, Celular y Timestamp de cada registro
 */

const SORTEO_CONFIG = {
  // ID de la planilla de Google Sheets
  SPREADSHEET_ID: "1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA",
  SPREADSHEET_URL: "https://docs.google.com/spreadsheets/d/1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA/edit?usp=drivesdk",

  // Nombres exactos de las pestañas en Google Sheets
  SHEETS: {
    LOCALES: "locales",
    FECHAS: "fechas",
    DATOS: "datos"
  },

  // URL de la Aplicación Web de Google Apps Script (termina en /exec)
  WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbxkN4OHQ8FrQphkjx0VQNjQCeEDG0yk5eNi6JcCCH6qsCBBttjui1_HQMakiyWwjAKV2Q/exec",

  // Fallback solo si no hubiera conexión momentánea con Google Sheets
  FALLBACK_DRAW_DATE_ISO: "2026-12-23T18:00:00-03:00",
  FALLBACK_LOCALES: ["A", "B", "C", "D", "E"],

  // Hora por defecto del sorteo cuando la hoja "fechas" solo indica día/mes/año (Uruguay -03:00)
  DRAW_DEFAULT_HOUR: "18:00:00",

  // Enlaces oficiales VIDA
  PHONE_DISPLAY: "0800 8320",
  PHONE_LINK: "tel:08008320",
  WHATSAPP_NUMBER: "59822043739",
  WHATSAPP_MESSAGE: "Hola, quisiera consultar sobre el Sorteo VIDA y cómo afiliarme.",
  BUENAVIDA_URL: "https://www.vida.com.uy/buenavida",
  INSTAGRAM_HANDLE: "@vidaserviciodecomp",
  INSTAGRAM_URL: "https://www.instagram.com/vidaserviciodecomp/"
};

window.SORTEO_CONFIG = SORTEO_CONFIG;
