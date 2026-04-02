/**
 * sanitize.js — Radar Relevantia MVP
 * Utilitários centralizados de sanitização, validação e segurança.
 *
 * REQUIRES: Load BEFORE any page-specific scripts.
 *   <script src="js/sanitize.js"></script>
 *
 * Provides: escapeHtml, validateEmail, validateCNPJ, validatePhone,
 *           validateURL, sanitizeURLParam, validateFileUpload, throttle,
 *           rateLimiter
 */

// ─── HTML ESCAPING (Anti-XSS) ──────────────────────────────
/**
 * Escapa caracteres perigosos para uso seguro em innerHTML.
 * Sempre use esta função ao interpolar dados de usuário/API em HTML.
 * @param {*} str - string a ser escapada
 * @returns {string} string segura para innerHTML
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── EMAIL VALIDATION ───────────────────────────────────────
/**
 * Valida formato de email.
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplificado — aceita domínios com TLD de 2+ chars
  var re = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

// ─── CNPJ VALIDATION (com checksum) ─────────────────────────
/**
 * Valida CNPJ com algoritmo de dígitos verificadores.
 * @param {string} cnpj - com ou sem formatação
 * @returns {boolean}
 */
function validateCNPJ(cnpj) {
  if (!cnpj) return false;
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;

  // Rejeita CNPJs com todos os dígitos iguais (ex: 11.111.111/1111-11)
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Cálculo do primeiro dígito verificador
  var weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  var sum = 0;
  for (var i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weights1[i];
  }
  var remainder = sum % 11;
  var digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(cnpj.charAt(12)) !== digit1) return false;

  // Cálculo do segundo dígito verificador
  var weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (var j = 0; j < 13; j++) {
    sum += parseInt(cnpj.charAt(j)) * weights2[j];
  }
  remainder = sum % 11;
  var digit2 = remainder < 2 ? 0 : 11 - remainder;
  return parseInt(cnpj.charAt(13)) === digit2;
}

// ─── PHONE VALIDATION ───────────────────────────────────────
/**
 * Valida formato de telefone brasileiro.
 * Aceita: (11) 91234-5678, 11912345678, +5511912345678
 * @param {string} phone - número com ou sem formatação
 * @returns {boolean}
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  var digits = phone.replace(/\D/g, '');
  // Aceita 10-11 dígitos (fixo/celular) ou 12-13 com código do país
  return digits.length >= 10 && digits.length <= 13;
}

// ─── URL VALIDATION ─────────────────────────────────────────
/**
 * Valida formato de URL.
 * @param {string} url
 * @returns {boolean}
 */
function validateURL(url) {
  if (!url || typeof url !== 'string') return false;
  var trimmed = url.trim();
  // Adiciona protocolo se ausente
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  try {
    var parsed = new URL(trimmed);
    // Verifica que tem pelo menos um domínio com TLD
    return /\.[a-zA-Z]{2,}$/.test(parsed.hostname);
  } catch (e) {
    return false;
  }
}

// ─── URL PARAMETER SANITIZATION ─────────────────────────────
/**
 * Sanitiza valor de parâmetro de URL para uso seguro.
 * Remove tags HTML e limita comprimento.
 * @param {string} value
 * @param {number} maxLength - comprimento máximo (default: 200)
 * @returns {string}
 */
function sanitizeURLParam(value, maxLength) {
  if (!value || typeof value !== 'string') return '';
  maxLength = maxLength || 200;
  // Remove qualquer tag HTML
  var cleaned = value.replace(/<[^>]*>/g, '');
  // Remove caracteres de controle
  cleaned = cleaned.replace(/[\x00-\x1f\x7f]/g, '');
  // Limita comprimento
  return cleaned.substring(0, maxLength).trim();
}

// ─── FILE UPLOAD VALIDATION ─────────────────────────────────
/**
 * Valida arquivo para upload (tipo, tamanho, extensão).
 * @param {File} file - arquivo do input
 * @param {Object} opts - opções de validação
 * @param {string[]} opts.allowedTypes - MIME types permitidos (ex: ['image/jpeg', 'image/png'])
 * @param {string[]} opts.allowedExtensions - extensões permitidas (ex: ['.jpg', '.png'])
 * @param {number} opts.maxSizeMB - tamanho máximo em MB
 * @returns {{ valid: boolean, error: string }}
 */
function validateFileUpload(file, opts) {
  if (!file) return { valid: false, error: 'Nenhum arquivo selecionado.' };
  opts = opts || {};

  // Validar tipo MIME
  if (opts.allowedTypes && opts.allowedTypes.length > 0) {
    if (opts.allowedTypes.indexOf(file.type) === -1) {
      return { valid: false, error: 'Tipo de arquivo não permitido: ' + (file.type || 'desconhecido') + '. Aceitos: ' + opts.allowedTypes.join(', ') };
    }
  }

  // Validar extensão
  if (opts.allowedExtensions && opts.allowedExtensions.length > 0) {
    var ext = '.' + (file.name || '').split('.').pop().toLowerCase();
    if (opts.allowedExtensions.indexOf(ext) === -1) {
      return { valid: false, error: 'Extensão não permitida: ' + ext + '. Aceitas: ' + opts.allowedExtensions.join(', ') };
    }
  }

  // Validar tamanho
  if (opts.maxSizeMB) {
    var maxBytes = opts.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      var sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return { valid: false, error: 'Arquivo muito grande: ' + sizeMB + 'MB. Máximo: ' + opts.maxSizeMB + 'MB.' };
    }
  }

  return { valid: true, error: '' };
}

// ─── THROTTLE ───────────────────────────────────────────────
/**
 * Cria versão throttled de uma função (máximo 1 execução por intervalo).
 * @param {Function} fn - função a ser throttled
 * @param {number} delay - intervalo mínimo em ms
 * @returns {Function}
 */
function throttle(fn, delay) {
  var lastCall = 0;
  return function() {
    var now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, arguments);
    }
  };
}

// ─── RATE LIMITER (para login/validação) ────────────────────
/**
 * Rate limiter baseado em localStorage.
 * Bloqueia após N tentativas falhas por um período.
 *
 * @param {string} key - identificador único (ex: 'login_attempts')
 * @param {number} maxAttempts - tentativas máximas antes do bloqueio (default: 5)
 * @param {number} blockSeconds - duração do bloqueio em segundos (default: 30)
 * @returns {{ canAttempt: function, recordFailure: function, recordSuccess: function, remainingSeconds: function }}
 */
function rateLimiter(key, maxAttempts, blockSeconds) {
  maxAttempts = maxAttempts || 5;
  blockSeconds = blockSeconds || 30;
  var storageKey = 'rr_rl_' + key;

  function _getData() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return { attempts: 0, blockedUntil: 0 };
      return JSON.parse(raw);
    } catch (e) {
      return { attempts: 0, blockedUntil: 0 };
    }
  }

  function _setData(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) { /* silently fail */ }
  }

  return {
    /** Verifica se pode fazer tentativa */
    canAttempt: function() {
      var data = _getData();
      if (data.blockedUntil && Date.now() < data.blockedUntil) {
        return false;
      }
      // Reset se o bloqueio expirou
      if (data.blockedUntil && Date.now() >= data.blockedUntil) {
        _setData({ attempts: 0, blockedUntil: 0 });
      }
      return true;
    },

    /** Registra tentativa falha */
    recordFailure: function() {
      var data = _getData();
      // Se bloqueio expirou, resetar
      if (data.blockedUntil && Date.now() >= data.blockedUntil) {
        data = { attempts: 0, blockedUntil: 0 };
      }
      data.attempts = (data.attempts || 0) + 1;
      if (data.attempts >= maxAttempts) {
        data.blockedUntil = Date.now() + (blockSeconds * 1000);
      }
      _setData(data);
    },

    /** Registra tentativa bem-sucedida (reseta contador) */
    recordSuccess: function() {
      _setData({ attempts: 0, blockedUntil: 0 });
    },

    /** Retorna segundos restantes do bloqueio (0 se não bloqueado) */
    remainingSeconds: function() {
      var data = _getData();
      if (!data.blockedUntil || Date.now() >= data.blockedUntil) return 0;
      return Math.ceil((data.blockedUntil - Date.now()) / 1000);
    }
  };
}

// ─── TEXT LENGTH VALIDATION ─────────────────────────────────
/**
 * Valida comprimento de texto.
 * @param {string} str
 * @param {number} min - mínimo de caracteres
 * @param {number} max - máximo de caracteres
 * @returns {boolean}
 */
function validateLength(str, min, max) {
  if (!str || typeof str !== 'string') return min === 0;
  var len = str.trim().length;
  return len >= min && len <= max;
}
