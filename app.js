/**
 * ==========================================================================
 * LANDING SORTEO VIDA - Lógica Interactiva & Sincronización Google Sheets
 * ==========================================================================
 * - Lee la hoja "locales" en tiempo real para poblar el dropdown de Locales.
 * - Lee la hoja "fechas" en tiempo real para alimentar la cuenta regresiva.
 * - Envía Local, Nombre y Celular (+ Timestamp en Apps Script) a la hoja "datos".
 */

document.addEventListener('DOMContentLoaded', () => {
  const cfg = window.SORTEO_CONFIG || {};
  const SPREADSHEET_ID = cfg.SPREADSHEET_ID || '1tGOVBhMYDaa232YfXEDzJFldD2feLKQz5T7ArZ1ZMQA';
  const SHEET_LOCALES = (cfg.SHEETS && cfg.SHEETS.LOCALES) || 'locales';
  const SHEET_FECHAS = (cfg.SHEETS && cfg.SHEETS.FECHAS) || 'fechas';

  // --- Year & Header ---
  const elYear = document.getElementById('current-year');
  if (elYear) elYear.textContent = String(new Date().getFullYear());

  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
  });

  // --- Mobile Navigation Drawer ---
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  if (mobileBtn && mobileDrawer) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', String(isOpen));
      mobileBtn.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
    });

    mobileDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
        mobileBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });
  }

  // ========================================================================
  // 1. LECTURA EN VIVO DESDE GOOGLE SHEETS (JSONP - Sin bloqueos CORS)
  // ========================================================================
  let gvizCounter = 0;

  function fetchGoogleSheetColumn(sheetName) {
    return new Promise((resolve, reject) => {
      const cbName = `__vidaGvizCb_${Date.now()}_${++gvizCounter}`;
      const script = document.createElement('script');
      let settled = false;

      const cleanup = () => {
        try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Tiempo de espera agotado al leer la hoja "${sheetName}"`));
      }, 9000);

      window[cbName] = (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();

        if (!response || response.status !== 'ok' || !response.table) {
          reject(new Error(`Respuesta inválida de la hoja "${sheetName}"`));
          return;
        }

        const rows = response.table.rows || [];
        const values = [];

        rows.forEach((row, idx) => {
          const cell = row && row.c && row.c[0];
          if (!cell) return;
          const raw = cell.f !== undefined && cell.f !== null ? String(cell.f).trim() : (cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : '');
          if (!raw) return;
          // Omitir fila de título si Google Visualization la devolvió como primera fila de datos
          if (idx === 0 && /^(locales?|comercio|comercios|pr[oó]ximo\s*sorteo|fechas?)$/i.test(raw)) {
            return;
          }
          values.push({ raw, v: cell.v, f: cell.f });
        });

        resolve(values);
      };

      script.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error(`No se pudo cargar la hoja "${sheetName}"`));
      };

      const encodedSheet = encodeURIComponent(sheetName);
      script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=responseHandler:${cbName}&sheet=${encodedSheet}&_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  // ========================================================================
  // 2. CARGA DEL DROPDOWN DE LOCALES (Hoja "locales")
  // ========================================================================
  const selectLocal = document.getElementById('local');
  const localesHint = document.getElementById('locales-status-hint');

  function populateLocales(localesList, sourceLabel) {
    if (!selectLocal) return;
    selectLocal.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccioná tu local / comercio';
    selectLocal.appendChild(placeholder);

    localesList.forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      selectLocal.appendChild(opt);
    });

    selectLocal.disabled = false;
    if (localesHint) {
      localesHint.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success);"></i> ${sourceLabel}`;
    }
  }

  async function loadLocales() {
    try {
      const items = await fetchGoogleSheetColumn(SHEET_LOCALES);
      const uniqueLocales = [...new Set(items.map((i) => i.raw).filter(Boolean))];
      if (uniqueLocales.length > 0) {
        populateLocales(uniqueLocales, `${uniqueLocales.length} locales disponibles actualizados.`);
        return;
      }
      throw new Error('La hoja locales está vacía');
    } catch (err) {
      console.warn('Usando lista de respaldo de locales:', err);
      const fallback = cfg.FALLBACK_LOCALES || ['A', 'B', 'C', 'D', 'E'];
      populateLocales(fallback, 'Locales cargados.');
    }
  }

  // ========================================================================
  // 3. CUENTA REGRESIVA DESDE LA HOJA "fechas"
  // ========================================================================
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');
  const elTopDate = document.getElementById('top-draw-date');
  const elHeroTicketDate = document.getElementById('hero-ticket-date');
  const elCountdownDateLabel = document.getElementById('countdown-date-label');
  const elPreviewFecha = document.getElementById('preview-fecha');
  const elCountdownStatus = document.getElementById('countdown-status-msg');

  const defaultTime = cfg.DRAW_DEFAULT_HOUR || '18:00:00';
  let countdownInterval = null;

  function parseSheetDate(entry) {
    const str = entry.raw.trim();

    // Caso 1: Formato Google gviz Date(YYYY, M, D[, h, m, s])
    if (typeof entry.v === 'string' && /^Date\(/.test(entry.v)) {
      const parts = entry.v.match(/\d+/g).map(Number);
      if (parts.length >= 3) {
        const y = parts[0];
        const m = String(parts[1] + 1).padStart(2, '0');
        const d = String(parts[2]).padStart(2, '0');
        const hh = parts[3] !== undefined ? String(parts[3]).padStart(2, '0') : defaultTime.slice(0, 2);
        const mm = parts[4] !== undefined ? String(parts[4]).padStart(2, '0') : defaultTime.slice(3, 5);
        const ss = parts[5] !== undefined ? String(parts[5]).padStart(2, '0') : defaultTime.slice(6, 8);
        return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}-03:00`);
      }
    }

    // Caso 2: DD/MM/YYYY [HH:mm[:ss]]
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      const y = dmy[3];
      const timePart = dmy[4]
        ? `${dmy[4].padStart(2, '0')}:${dmy[5]}:${dmy[6] || '00'}`
        : defaultTime;
      return new Date(`${y}-${m}-${d}T${timePart}-03:00`);
    }

    // Caso 3: YYYY-MM-DD [HH:mm[:ss]]
    const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (ymd) {
      const y = ymd[1];
      const m = ymd[2].padStart(2, '0');
      const d = ymd[3].padStart(2, '0');
      const timePart = ymd[4]
        ? `${ymd[4].padStart(2, '0')}:${ymd[5]}:${ymd[6] || '00'}`
        : defaultTime;
      return new Date(`${y}-${m}-${d}T${timePart}-03:00`);
    }

    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatDateLongES(date) {
    return new Intl.DateTimeFormat('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Montevideo'
    }).format(date);
  }

  function formatDateShortES(date) {
    return new Intl.DateTimeFormat('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Montevideo'
    }).format(date);
  }

  function startCountdown(targetDate) {
    const longLabel = formatDateLongES(targetDate);
    const shortLabel = formatDateShortES(targetDate);

    if (elTopDate) elTopDate.textContent = longLabel;
    if (elHeroTicketDate) elHeroTicketDate.textContent = shortLabel;
    if (elCountdownDateLabel) elCountdownDateLabel.textContent = longLabel;
    if (elPreviewFecha) elPreviewFecha.textContent = shortLabel;

    const targetMs = targetDate.getTime();

    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        if (cdDays) cdDays.textContent = '00';
        if (cdHours) cdHours.textContent = '00';
        if (cdMinutes) cdMinutes.textContent = '00';
        if (cdSeconds) cdSeconds.textContent = '00';
        if (elCountdownStatus) {
          elCountdownStatus.textContent = '¡Llegó el día del sorteo! Seguinos en @vidaserviciodecomp para conocer a los ganadores.';
          elCountdownStatus.classList.remove('hidden');
        }
        return;
      }

      if (elCountdownStatus) elCountdownStatus.classList.add('hidden');
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
      if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
      if (cdMinutes) cdMinutes.textContent = String(minutes).padStart(2, '0');
      if (cdSeconds) cdSeconds.textContent = String(seconds).padStart(2, '0');
    };

    if (countdownInterval) clearInterval(countdownInterval);
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  async function loadNextDrawDate() {
    try {
      const items = await fetchGoogleSheetColumn(SHEET_FECHAS);
      const validDates = items
        .map(parseSheetDate)
        .filter((d) => d && !Number.isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (validDates.length > 0) {
        const now = Date.now();
        // Elegir la fecha futura más cercana; si todas pasaron, mostrar la última registrada
        const nextUpcoming = validDates.find((d) => d.getTime() > now) || validDates[validDates.length - 1];
        startCountdown(nextUpcoming);
        return;
      }
      throw new Error('No se encontraron fechas válidas en la hoja fechas');
    } catch (err) {
      console.warn('Usando fecha de respaldo:', err);
      const fallbackDate = new Date(cfg.FALLBACK_DRAW_DATE_ISO || '2026-12-23T18:00:00-03:00');
      startCountdown(fallbackDate);
    }
  }

  // Iniciar carga en paralelo desde Google Sheets
  loadLocales();
  loadNextDrawDate();

  // ========================================================================
  // 4. FORMULARIO & VISTA PREVIA DEL CUPÓN (Local, Nombre, Celular)
  // ========================================================================
  const form = document.getElementById('sorteo-form');
  const inputNombre = document.getElementById('nombre');
  const inputCelular = document.getElementById('celular');
  const previewNombre = document.getElementById('preview-nombre');
  const previewLocal = document.getElementById('preview-local');
  const previewCelular = document.getElementById('preview-celular');

  const submitBtn = document.getElementById('btn-submit-form');
  const submitBtnText = document.getElementById('submit-btn-text');
  const submitSpinner = document.getElementById('submit-spinner');

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  function updatePreview() {
    if (previewNombre) {
      const val = inputNombre.value.trim();
      previewNombre.textContent = val ? val.toUpperCase() : 'TU NOMBRE';
    }
    if (previewLocal) {
      previewLocal.textContent = selectLocal.value || 'Seleccioná un local';
    }
    if (previewCelular) {
      previewCelular.textContent = inputCelular.value.trim() || '09X XXX XXX';
    }
  }

  if (selectLocal) selectLocal.addEventListener('change', updatePreview);
  if (inputNombre) inputNombre.addEventListener('input', updatePreview);
  if (inputCelular) {
    inputCelular.addEventListener('input', (e) => {
      e.target.value = formatPhone(e.target.value);
      updatePreview();
    });
  }

  if (form) {
    form.querySelectorAll('input, select').forEach((field) => {
      const clearErr = () => {
        const group = field.closest('.form-group');
        if (group) group.classList.remove('has-error');
      };
      field.addEventListener('input', clearErr);
      field.addEventListener('change', clearErr);
    });
  }

  function validateForm() {
    let isValid = true;
    const toggleErr = (el, hasError) => {
      const group = el.closest('.form-group');
      if (!group) return;
      if (hasError) {
        group.classList.add('has-error');
        isValid = false;
      } else {
        group.classList.remove('has-error');
      }
    };

    toggleErr(selectLocal, !selectLocal.value);
    toggleErr(inputNombre, inputNombre.value.trim().length < 2);

    const phoneDigits = inputCelular.value.replace(/\D/g, '');
    toggleErr(inputCelular, phoneDigits.length < 8 || phoneDigits.length > 9);

    return isValid;
  }

  // --- Modals & Confetti ---
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach((m) => {
      m.hidden = true;
    });
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', closeAllModals);
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  function launchConfetti() {
    const layer = document.getElementById('confetti-layer');
    if (!layer) return;
    layer.innerHTML = '';
    const colors = ['#1b3580', '#942143', '#e5b25d', '#10b981', '#f5cd79'];

    for (let i = 0; i < 42; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.45}s`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      layer.appendChild(piece);
    }
  }

  // --- Envío del formulario a la hoja "datos" ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm()) {
        const firstErr = form.querySelector('.has-error');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      submitBtn.disabled = true;
      submitBtnText.classList.add('hidden');
      submitSpinner.classList.remove('hidden');

      const nowFormatted = new Intl.DateTimeFormat('es-UY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Montevideo'
      }).format(new Date());

      const payload = {
        local: selectLocal.value.trim(),
        nombre: inputNombre.value.trim(),
        celular: inputCelular.value.trim(),
        timestamp: nowFormatted
      };

      // Respaldo local en navegador
      try {
        const saved = JSON.parse(localStorage.getItem('vida_sorteo_datos') || '[]');
        saved.push(payload);
        localStorage.setItem('vida_sorteo_datos', JSON.stringify(saved));
      } catch (_) {
        // Ignorar en modo incógnito restringido
      }

      let syncNote = 'Falta configurar WEBHOOK_URL en config.js para guardar automáticamente en la hoja "datos" de Google Sheets (ver README.md).';

      if (cfg.WEBHOOK_URL && cfg.WEBHOOK_URL.startsWith('http')) {
        try {
          await fetch(cfg.WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
          });
          syncNote = 'Tus datos fueron guardados correctamente en la hoja "datos" del sorteo.';
        } catch (err) {
          console.error('Error enviando al webhook:', err);
          syncNote = 'No pudimos confirmar la conexión en este momento, pero tu registro fue respaldado.';
        }
      }

      document.getElementById('voucher-local').textContent = payload.local;
      document.getElementById('voucher-nombre').textContent = payload.nombre;
      document.getElementById('voucher-celular').textContent = payload.celular;
      document.getElementById('voucher-timestamp').textContent = nowFormatted;
      document.getElementById('modal-sync-note').textContent = syncNote;

      submitBtn.disabled = false;
      submitBtnText.classList.remove('hidden');
      submitSpinner.classList.add('hidden');

      form.reset();
      updatePreview();
      openModal('modal-success');
      launchConfetti();
    });
  }
});
