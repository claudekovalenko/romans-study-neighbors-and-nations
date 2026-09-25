// Sanity checks for a series file. Used by tests and `npm run validate`.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validateSeries(series) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  need(typeof series.id === 'string' && series.id, 'id is required');
  need(typeof series.title === 'string' && series.title, 'title is required');
  need(ISO.test(series.startDate ?? ''), 'startDate must be YYYY-MM-DD');
  need(Array.isArray(series.weeks) && series.weeks.length > 0, 'weeks must be a non-empty array');

  (series.weeks ?? []).forEach((w, i) => {
    const at = `weeks[${i}]`;
    if (w.date !== undefined) need(ISO.test(w.date), `${at}.date must be YYYY-MM-DD`);
    need(w.days === undefined || Array.isArray(w.days), `${at}.days must be an array`);
    (w.days ?? []).forEach((d, j) => {
      if (d.date !== undefined) need(ISO.test(d.date), `${at}.days[${j}].date must be YYYY-MM-DD`);
    });
    for (const k of ['questions']) {
      if (w[k] !== undefined) need(Array.isArray(w[k]), `${at}.${k} must be an array`);
    }
  });

  const offsets = series.readingPlan?.dayOffsets;
  if (offsets !== undefined) {
    need(Array.isArray(offsets) && offsets.every(Number.isInteger), 'readingPlan.dayOffsets must be integers');
  }
  return errors;
}
