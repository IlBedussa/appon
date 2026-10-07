// Prenotazione videochiamata di 15 minuti: regole degli orari, fusi orari e file .ics.
// Codice condiviso tra il browser (componente BookingForm) e l'endpoint mock /api/book-call.
// Gli orari sono definiti in ora di Israele (Asia/Jerusalem) e convertiti nel fuso dell'utente
// con Intl (gestisce automaticamente l'ora legale di entrambi i paesi).
// [DA CONFERMARE] giorni/orari reali, festività, durata del buffer tra le chiamate.

export const IL_TZ = 'Asia/Jerusalem';
export const BOOKING_RULES = {
  days: [0, 1, 2, 3, 4], // domenica–giovedì (0 = domenica) [DA CONFERMARE]
  startHour: 9,          // 09:00 ora israeliana [DA CONFERMARE]
  endHour: 18,           // ultima chiamata deve finire entro le 18:00
  stepMin: 30,           // una chiamata ogni 30 min (15 min + margine)
  durationMin: 15,
  leadHours: 12,         // preavviso minimo
  horizonDays: 21,       // prenotabile fino a 3 settimane
};

/** Offset (ms) del fuso `tz` all'istante `ms` (ora locale − UTC). */
export function tzOffset(ms: number, tz: string): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return wall - Math.floor(ms / 1000) * 1000;
}

/** Istante UTC (ms) di una data/ora "da muro" nel fuso `tz`. */
export function zonedToUtc(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffset(guess, tz);
  const o2 = tzOffset(t, tz);
  t = guess - o2; // seconda passata: corregge i casi a cavallo del cambio d'ora
  return t;
}

/** Data (YYYY-MM-DD) e giorno della settimana nel fuso `tz` per l'istante `ms`. */
export function zonedDate(ms: number, tz: string): { date: string; weekday: number } {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: wd };
}

export interface Slot { date: string; time: string; utc: number }

/** Giorni (date israeliane) prenotabili a partire da `now`. */
export function bookableDays(now = Date.now(), rules = BOOKING_RULES): string[] {
  const out: string[] = [];
  for (let i = 0; i <= rules.horizonDays; i++) {
    const { date, weekday } = zonedDate(now + i * 86_400_000, IL_TZ);
    if (rules.days.includes(weekday) && slotsFor(date, now, rules).length && !out.includes(date)) out.push(date);
  }
  return out;
}

/** Orari liberi in un giorno israeliano (escluse le ore entro il preavviso minimo). */
export function slotsFor(date: string, now = Date.now(), rules = BOOKING_RULES): Slot[] {
  const [y, m, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (!rules.days.includes(wd)) return [];
  const out: Slot[] = [];
  for (let min = rules.startHour * 60; min + rules.durationMin <= rules.endHour * 60; min += rules.stepMin) {
    const time = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    const utc = zonedToUtc(date, time, IL_TZ);
    if (utc - now >= rules.leadHours * 3_600_000 && utc - now <= (rules.horizonDays + 1) * 86_400_000) out.push({ date, time, utc });
  }
  return out;
}

/** true se l'istante corrisponde a uno slot valido (controllo lato server). */
export function isValidSlot(utc: number, now = Date.now(), rules = BOOKING_RULES): boolean {
  const { date } = zonedDate(utc, IL_TZ);
  return slotsFor(date, now, rules).some((s) => s.utc === utc);
}

const icsDate = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => '\\' + c);

/** File iCalendar (RFC 5545) per l'evento, generato nel browser: nessun invio email. */
export function toIcs(o: { utc: number; durationMin: number; title: string; description: string; uid: string }): string {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Easybayit//Video call//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${o.uid}@easybayit`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(o.utc)}`, `DTEND:${icsDate(o.utc + o.durationMin * 60_000)}`,
    `SUMMARY:${icsText(o.title)}`, `DESCRIPTION:${icsText(o.description)}`, 'STATUS:TENTATIVE', 'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}

export const BOOKING_LANGS = ['en', 'he', 'fr', 'it'] as const;
export const BOOKING_TOPICS = ['owner', 'care', 'switch', 'buy', 'other'] as const;
export const BOOKING_PLATFORMS = ['meet', 'zoom', 'whatsapp'] as const;
