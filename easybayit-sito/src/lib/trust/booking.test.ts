// Test delle regole di prenotazione e della conversione dei fusi orari.
// Esecuzione: node --experimental-strip-types --test src/lib/trust/booking.test.ts  (script npm: test:trust)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedToUtc, tzOffset, slotsFor, isValidSlot, bookableDays, toIcs, zonedDate, IL_TZ } from './booking.ts';

test('Israele: ora legale (UTC+3) e ora solare (UTC+2)', () => {
  assert.equal(new Date(zonedToUtc('2026-10-04', '09:00', IL_TZ)).toISOString(), '2026-10-04T06:00:00.000Z');
  assert.equal(new Date(zonedToUtc('2026-12-06', '09:00', IL_TZ)).toISOString(), '2026-12-06T07:00:00.000Z');
});
test('conversione verso altri fusi (New York, Londra, Roma, Parigi)', () => {
  const t = zonedToUtc('2026-10-05', '15:00', IL_TZ); // lunedì 15:00 a Gerusalemme = 12:00 UTC
  const wall = (tz: string) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(t);
  assert.equal(wall('America/New_York'), '08:00');
  assert.equal(wall('Europe/London'), '13:00');
  assert.equal(wall('Europe/Rome'), '14:00');
  assert.equal(wall('Europe/Paris'), '14:00');
});
test('settimane con cambio d\'ora non allineato (fine ottobre: Europa già solare, Israele ancora legale)', () => {
  // 2026: Europa torna all'ora solare il 25/10, Israele il 25/10 → stesso giorno; verifichiamo comunque l'offset
  assert.equal(tzOffset(Date.UTC(2026, 9, 20, 12), IL_TZ), 3 * 3_600_000);
  assert.equal(tzOffset(Date.UTC(2026, 10, 20, 12), IL_TZ), 2 * 3_600_000);
});
test('nessuno slot di venerdì e sabato; domenica sì', () => {
  const now = Date.UTC(2026, 9, 1, 0, 0);
  assert.equal(slotsFor('2026-10-09', now).length, 0); // venerdì
  assert.equal(slotsFor('2026-10-10', now).length, 0); // sabato
  const sun = slotsFor('2026-10-11', now);
  assert.equal(sun[0].time, '09:00');
  assert.equal(sun.at(-1)!.time, '17:30');
  assert.equal(sun.length, 18);
});
test('preavviso minimo e orizzonte', () => {
  const now = zonedToUtc('2026-10-04', '08:00', IL_TZ); // domenica 08:00
  assert.equal(slotsFor('2026-10-04', now).length, 0); // tutto entro 12 h → escluso… tranne nessuno (ultima 17:30 < 20:00)
  assert.ok(slotsFor('2026-10-05', now).length > 0);
  assert.equal(slotsFor('2026-11-30', now).length, 0); // oltre 3 settimane
  const days = bookableDays(now);
  assert.ok(days.length >= 12 && days.length <= 16, String(days.length));
  assert.ok(days.every((d) => [0, 1, 2, 3, 4].includes(new Date(d + 'T12:00:00Z').getUTCDay())));
});
test('validazione lato server dello slot', () => {
  const now = Date.UTC(2026, 9, 1);
  const ok = zonedToUtc('2026-10-06', '10:30', IL_TZ);
  assert.equal(isValidSlot(ok, now), true);
  assert.equal(isValidSlot(ok + 60_000, now), false); // non allineato
  assert.equal(isValidSlot(zonedToUtc('2026-10-06', '18:00', IL_TZ), now), false); // fuori orario
  assert.equal(isValidSlot(zonedToUtc('2026-10-09', '10:00', IL_TZ), now), false); // venerdì
});
test('zonedDate e file .ics', () => {
  assert.deepEqual(zonedDate(Date.UTC(2026, 9, 3, 22, 30), IL_TZ), { date: '2026-10-04', weekday: 0 });
  const ics = toIcs({ utc: Date.UTC(2026, 9, 5, 12), durationMin: 15, title: 'Easybayit, call', description: 'a;b', uid: 'x1' });
  assert.match(ics, /DTSTART:20261005T120000Z/);
  assert.match(ics, /DTEND:20261005T121500Z/);
  assert.match(ics, /SUMMARY:Easybayit\\, call/);
  assert.ok(ics.includes('\r\n'));
});
