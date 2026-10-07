// Macchina a stati della conversazione: funzione PURA (stato + input -> nuovo stato, risposte, azioni).
// Nessun accesso a DB o rete: così è testabile a fondo e uguale per WhatsApp e web chat.
import type { Action, Category, ConvData, Ctx, Inbound, Outbound, State, StepResult } from './types';
import { botStrings, fillB } from './i18n';
import type { Nlu } from './nlu';

export const CATEGORIES: Category[] = ['plumbing', 'electrical', 'heating_ac', 'appliances', 'doors_windows', 'gas', 'pests', 'other'];
const MAX_INVALID = 3;

export function step(state: State, data: ConvData, input: Inbound, ctx: Ctx, nlu: Nlu): StepResult {
  const s = botStrings[ctx.locale];
  const text = (input.text ?? '').trim();
  const u = text ? nlu.understand(text, ctx.locale) : {};
  const reply: Outbound[] = [];
  const actions: Action[] = [];
  let d: ConvData = { ...data };
  const r = (st: State): StepResult => ({ state: st, data: d, replies: reply, actions });

  // ---- prompt di ogni stato ----
  const ask = (st: State): StepResult => {
    d.invalid = 0;
    switch (st) {
      case 'ask_property':
        reply.push({ text: s.askProperty, buttons: ctx.properties.map((p) => ({ id: `prop:${p.id}`, title: `${p.code} · ${p.name}`.slice(0, 24) })) });
        break;
      case 'ask_category':
        reply.push({ text: `${s.askCategory}\n${CATEGORIES.map((c, i) => `${i + 1}. ${s.cats[c]}`).join('\n')}`, buttons: CATEGORIES.map((c) => ({ id: `cat:${c}`, title: s.cats[c].slice(0, 24) })) });
        break;
      case 'ask_description': reply.push({ text: s.askDescription }); break;
      case 'ask_media': reply.push({ text: fillB(s.askMedia, { n: ctx.maxMedia }), buttons: [{ id: 'media:skip', title: s.skip }] }); break;
      case 'ask_urgency': reply.push({ text: s.askUrgency, buttons: [{ id: 'urg:yes', title: s.urgentYes }, { id: 'urg:no', title: s.urgentNo }] }); break;
      case 'ask_availability':
        reply.push({ text: s.askAvailability, buttons: (['morning', 'afternoon', 'evening', 'any'] as const).map((k) => ({ id: `avail:${k}`, title: s.avail[k] })) });
        break;
      case 'confirm': {
        const p = ctx.properties.find((x) => x.id === d.propertyId);
        reply.push({
          text: fillB(s.summary, {
            property: p ? `${p.code} · ${p.name}` : '—', category: d.category ? s.cats[d.category] : '—', description: d.description ?? '—',
            media: d.media?.length ? String(d.media.length) : s.none, urgency: d.urgent ? s.urgentLabel : s.routineLabel, availability: d.availability ?? '—',
          }),
          buttons: [{ id: 'confirm:yes', title: s.confirm }, { id: 'confirm:restart', title: s.edit }],
        });
        break;
      }
    }
    return r(st);
  };
  const invalid = (st: State): StepResult => {
    d.invalid = (d.invalid ?? 0) + 1;
    reply.push({ text: s.notUnderstood });
    if (d.invalid >= MAX_INVALID) { d.invalid = 0; return ask(st); }
    return r(st);
  };
  // emergenza: messaggio di sicurezza immediato + urgenza forzata
  const checkEmergency = () => {
    if (u.emergency && !d.emergency) {
      d.emergency = u.emergency; d.urgent = true;
      if (!d.category && u.category) d.category = u.category;
      reply.push({ text: fillB(s.emergency, { kind: u.emergency, advice: s.emergencyKinds[u.emergency], phone: ctx.emergencyPhone }) });
    }
  };
  const afterMedia = () => (d.emergency ? ask('ask_availability') : ask('ask_urgency'));

  // ---- comandi globali ----
  if (state !== 'start' && state !== 'unknown_sender' && (u.intent === 'cancel' || input.replyId === 'cancel')) {
    reply.push({ text: s.cancelled }); actions.push({ type: 'close' });
    return r('cancelled');
  }
  if (state !== 'start' && (u.intent === 'restart' || input.replyId === 'confirm:restart')) {
    d = {}; reply.push({ text: s.restart });
    return ctx.properties.length > 1 ? ask('ask_property') : (d.propertyId = ctx.properties[0]?.id, ask('ask_category'));
  }

  switch (state) {
    case 'start':
    case 'done':
    case 'cancelled': {
      d = {};
      if (!ctx.properties.length) { reply.push({ text: s.unknown }); actions.push({ type: 'close' }); return r('unknown_sender'); }
      reply.push({ text: fillB(s.hello, { name: ctx.tenantName?.split(' ')[0] ?? '' }).replace(/\s+!/, '!') });
      // il primo messaggio spesso descrive già il problema: lo si usa
      checkEmergency();
      if (!d.category && u.category && text.length > 3) d.category = u.category;
      if (text.length >= 15 && !u.intent) d.description = text;
      if (ctx.properties.length > 1) return ask('ask_property');
      d.propertyId = ctx.properties[0].id;
      if (!d.category) return ask('ask_category');
      return d.description ? ask('ask_media') : ask('ask_description');
    }
    case 'unknown_sender':
      if (!ctx.properties.length) { reply.push({ text: s.unknown }); return r('unknown_sender'); }
      return step('start', {}, input, ctx, nlu);

    case 'ask_property': {
      let id = input.replyId?.startsWith('prop:') ? input.replyId.slice(5) : undefined;
      const n = Number(text);
      if (!id && Number.isInteger(n) && n >= 1 && n <= ctx.properties.length) id = ctx.properties[n - 1].id;
      if (!id && text) id = ctx.properties.find((p) => text.toUpperCase().includes(p.code))?.id;
      if (!id || !ctx.properties.some((p) => p.id === id)) return invalid('ask_property');
      d.propertyId = id;
      if (!d.category) return ask('ask_category');
      return d.description ? ask('ask_media') : ask('ask_description');
    }
    case 'ask_category': {
      let c: Category | undefined = input.replyId?.startsWith('cat:') ? (input.replyId.slice(4) as Category) : undefined;
      const n = Number(text);
      if (!c && Number.isInteger(n) && n >= 1 && n <= CATEGORIES.length) c = CATEGORIES[n - 1];
      if (!c && u.category) c = u.category;
      if (!c || !CATEGORIES.includes(c)) return invalid('ask_category');
      d.category = c;
      if (c === 'gas' && !d.emergency) { d.emergency = 'gas'; d.urgent = true; reply.push({ text: fillB(s.emergency, { kind: 'gas', advice: s.emergencyKinds.gas, phone: ctx.emergencyPhone }) }); }
      checkEmergency();
      return d.description ? ask('ask_media') : ask('ask_description');
    }
    case 'ask_description': {
      if (input.media?.length && !text) return invalid('ask_description');
      if (text.length < 8) { reply.push({ text: s.tooShort }); return r('ask_description'); }
      d.description = text.slice(0, 2000);
      checkEmergency();
      return ask('ask_media');
    }
    case 'ask_media': {
      // i file arrivano già salvati dal motore (d.media aggiornato prima di chiamare step)
      if (input.media?.length) {
        const n = d.media?.length ?? 0;
        reply.push({ text: n >= ctx.maxMedia ? s.mediaMax : fillB(s.mediaGot, { n }), buttons: [{ id: 'media:done', title: s.done }] });
        if (n >= ctx.maxMedia) return afterMedia();
        return r('ask_media');
      }
      if (input.replyId === 'media:done' || input.replyId === 'media:skip' || u.intent === 'done' || u.intent === 'skip') return afterMedia();
      return invalid('ask_media');
    }
    case 'ask_urgency': {
      if (input.replyId === 'urg:yes' || u.intent === 'yes') d.urgent = true;
      else if (input.replyId === 'urg:no' || u.intent === 'no') d.urgent = false;
      else { checkEmergency(); if (d.emergency) return ask('ask_availability'); return invalid('ask_urgency'); }
      return ask('ask_availability');
    }
    case 'ask_availability': {
      const k = input.replyId?.startsWith('avail:') ? (input.replyId.slice(6) as keyof typeof s.avail) : undefined;
      const v = k && s.avail[k] ? s.avail[k] : text;
      if (!v || v.length < 2) return invalid('ask_availability');
      d.availability = v.slice(0, 200);
      return ask('confirm');
    }
    case 'confirm': {
      if (input.replyId === 'confirm:yes' || u.intent === 'yes') { actions.push({ type: 'create_request' }); return r('done'); }
      if (u.intent === 'no') { reply.push({ text: s.cancelled }); actions.push({ type: 'close' }); return r('cancelled'); }
      return invalid('confirm');
    }
  }
  return r(state);
}
