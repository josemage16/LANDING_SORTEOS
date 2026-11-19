/**
 * LANDING SORTEOS VIDA - Interactive Logic
 * Countdown timer, live coupon preview, Uruguayan CI & phone formatting/validation,
 * Google Sheets webhook submission, confetti modal, FAQ accordion & share actions.
 */

document.addEventListener('DOMContentLoaded', () => {
  const cfg = window.SORTEO_CONFIG || {};

  // --- Sync Campaign Config into UI ---
  const campaignName = cfg.CAMPAIGN_NAME || 'Gran Sorteo VIDA 2026';
  const drawDateLabel = cfg.DRAW_DATE_LABEL || '20 de diciembre de 2026 · 18:00 hs';
  const couponPrefix = cfg.COUPON_PREFIX || 'VIDA-SRT';

  const elTopDate = document.getElementById('top-draw-date');
  const elHeroCampaign = document.getElementById('hero-campaign-name');
  const elYear = document.getElementById('current-year');

  if (elTopDate) elTopDate.textContent = drawDateLabel;
  if (elHeroCampaign) elHeroCampaign.textContent = campaignName;
  if (elYear) elYear.textContent = String(new Date().getFullYear());

  // --- Sticky Header Shadow ---
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 20);
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

  // --- Live Countdown Timer ---
  const targetTimestamp = Date.parse(cfg.DRAW_DATE_ISO || '2026-12-20T18:00:00-03:00');
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMinutes = document.getElementById('cd-minutes');
  const cdSeconds = document.getElementById('cd-seconds');

  function updateCountdown() {
    if (!cdDays || Number.isNaN(targetTimestamp)) return;
    const diff = Math.max(0, targetTimestamp - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMinutes.textContent = String(minutes).padStart(2, '0');
    cdSeconds.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // --- Form Elements & Live Coupon Preview ---
  const form = document.getElementById('sorteo-form');
  const inputNombre = document.getElementById('nombre');
  const inputApellido = document.getElementById('apellido');
  const inputCedula = document.getElementById('cedula');
  const inputCelular = document.getElementById('celular');
  const inputEmail = document.getElementById('email');
  const inputDepartamento = document.getElementById('departamento');
  const checkboxBases = document.getElementById('acepto-bases');

  const previewNombre = document.getElementById('preview-nombre');
  const previewCedula = document.getElementById('preview-cedula');
  const previewDepartamento = document.getElementById('preview-departamento');
  const previewCodigo = document.getElementById('preview-codigo');

  const submitBtn = document.getElementById('btn-submit-form');
  const submitBtnText = document.getElementById('submit-btn-text');
  const submitSpinner = document.getElementById('submit-spinner');

  // Format Uruguayan CI: X.XXX.XXX-X or XXX.XXX-X
  function formatCI(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 1) return digits;
    const body = digits.slice(0, -1);
    const check = digits.slice(-1);
    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withDots}-${check}`;
  }

  // Format Uruguayan Mobile: 09X XXX XXX
  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  function updateCouponPreview() {
    const fullName = `${inputNombre.value.trim()} ${inputApellido.value.trim()}`.trim();
    previewNombre.textContent = fullName ? fullName.toUpperCase() : 'TU NOMBRE COMPLETO';
    previewCedula.textContent = inputCedula.value.trim() || '0.000.000-0';
    previewDepartamento.textContent = inputDepartamento.value || 'Uruguay';
  }

  if (inputNombre) inputNombre.addEventListener('input', updateCouponPreview);
  if (inputApellido) inputApellido.addEventListener('input', updateCouponPreview);
  if (inputDepartamento) inputDepartamento.addEventListener('change', updateCouponPreview);

  if (inputCedula) {
    inputCedula.addEventListener('input', (e) => {
      e.target.value = formatCI(e.target.value);
      updateCouponPreview();
    });
  }

  if (inputCelular) {
    inputCelular.addEventListener('input', (e) => {
      e.target.value = formatPhone(e.target.value);
    });
  }

  // Clear field errors on user edit
  if (form) {
    form.querySelectorAll('input, select').forEach((field) => {
      const clearErr = () => {
        const group = field.closest('.form-group, .form-checkbox-group');
        if (group) group.classList.remove('has-error');
      };
      field.addEventListener('input', clearErr);
      field.addEventListener('change', clearErr);
    });
  }

  // --- Validation Helper ---
  function validateForm() {
    let valid = true;

    const setError = (el, condition) => {
      const group = el.closest('.form-group, .form-checkbox-group');
      if (!group) return;
      if (condition) {
        group.classList.add('has-error');
        valid = false;
      } else {
        group.classList.remove('has-error');
      }
    };

    setError(inputNombre, inputNombre.value.trim().length < 2);
    setError(inputApellido, inputApellido.value.trim().length < 2);

    const ciDigits = inputCedula.value.replace(/\D/g, '');
    setError(inputCedula, ciDigits.length < 7 || ciDigits.length > 8);

    const phoneDigits = inputCelular.value.replace(/\D/g, '');
    setError(inputCelular, phoneDigits.length < 8 || phoneDigits.length > 9);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail.value.trim());
    setError(inputEmail, !emailOk);

    setError(inputDepartamento, !inputDepartamento.value);

    const afiliadoSelected = form.querySelector('input[name="es_afiliado"]:checked');
    const radioAnchor = form.querySelector('input[name="es_afiliado"]');
    setError(radioAnchor, !afiliadoSelected);

    setError(checkboxBases, !checkboxBases.checked);

    return valid;
  }

  function generateCouponCode() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `${couponPrefix}-${num}`;
  }

  function getUtmSource() {
    const params = new URLSearchParams(window.location.search);
    return params.get('utm_source') || params.get('ref') || 'Directo';
  }

  // --- Modals ---
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

  document.querySelectorAll('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });

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

  // --- Confetti Burst ---
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

  // --- Submit Handler ---
  let lastGeneratedCode = '';

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

      const afiliadoInput = form.querySelector('input[name="es_afiliado"]:checked');
      const codigoCupon = generateCouponCode();
      lastGeneratedCode = codigoCupon;

      const payload = {
        campana: campaignName,
        codigo_cupon: codigoCupon,
        nombre: inputNombre.value.trim(),
        apellido: inputApellido.value.trim(),
        cedula: inputCedula.value.trim(),
        celular: inputCelular.value.trim(),
        email: inputEmail.value.trim(),
        departamento: inputDepartamento.value,
        es_afiliado: afiliadoInput ? afiliadoInput.value : 'No especificado',
        acepto_bases: checkboxBases.checked,
        origen: getUtmSource(),
        timestamp: new Date().toISOString()
      };

      // Local backup in browser storage
      try {
        const stored = JSON.parse(localStorage.getItem('vida_sorteo_entries') || '[]');
        stored.push(payload);
        localStorage.setItem('vida_sorteo_entries', JSON.stringify(stored));
      } catch (_) {
        // Ignore storage errors in private mode
      }

      let syncMessage = 'Cupón registrado en modo demo local. Configurá WEBHOOK_URL en config.js para enviar a Google Sheets.';

      if (cfg.WEBHOOK_URL && cfg.WEBHOOK_URL.startsWith('http')) {
        try {
          await fetch(cfg.WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          syncMessage = 'Tu participación fue enviada y registrada en nuestra base oficial del sorteo.';
        } catch (err) {
          console.error('Webhook error:', err);
          syncMessage = 'Tu cupón fue generado y respaldado localmente. Si tenés dudas, escribinos por WhatsApp.';
        }
      }

      // Update live preview + success voucher modal
      previewCodigo.textContent = codigoCupon;
      document.getElementById('voucher-campaign').textContent = campaignName;
      document.getElementById('voucher-code').textContent = codigoCupon;
      document.getElementById('voucher-nombre').textContent = `${payload.nombre} ${payload.apellido}`;
      document.getElementById('voucher-cedula').textContent = payload.cedula;
      document.getElementById('voucher-departamento').textContent = payload.departamento;
      document.getElementById('voucher-fecha').textContent = drawDateLabel;
      document.getElementById('modal-sync-note').textContent = syncMessage;

      const shareText = encodeURIComponent(
        `¡Ya estoy participando en el ${campaignName} con mi cupón ${codigoCupon}! Participá vos también gratis aquí: ${window.location.href}`
      );
      document.getElementById('btn-share-whatsapp').href = `https://wa.me/?text=${shareText}`;

      submitBtn.disabled = false;
      submitBtnText.classList.remove('hidden');
      submitSpinner.classList.add('hidden');

      openModal('modal-success');
      launchConfetti();
    });
  }

  // --- Copy & Print Actions ---
  const btnCopy = document.getElementById('btn-copy-code');
  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      if (!lastGeneratedCode) return;
      try {
        await navigator.clipboard.writeText(lastGeneratedCode);
        btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
        setTimeout(() => {
          btnCopy.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar Código';
        }, 2000);
      } catch (_) {
        // Fallback if clipboard API unavailable
      }
    });
  }

  const btnPrint = document.getElementById('btn-print-voucher');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('active');

      document.querySelectorAll('.faq-item').forEach((other) => {
        other.classList.remove('active');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });
});
