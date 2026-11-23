function normalizeLocalizedText(value, label, { required = false } = {}) {
  let en = '';
  let ar = '';

  if (typeof value === 'string') {
    const raw = value.trim();
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) value = parsed;
      else value = raw;
    } catch {
      value = raw;
    }
    if (typeof value === 'string') {
      en = value;
      // Keep legacy single-language documents and clients readable.
      ar = en;
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    en = typeof value.en === 'string' ? value.en.trim() : '';
    ar = typeof value.ar === 'string' ? value.ar.trim() : '';
  }

  if (required && (!en || !ar)) {
    throw new Error(`${label} must include English and Arabic`);
  }

  return { en, ar };
}

module.exports = { normalizeLocalizedText };
