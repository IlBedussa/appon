// Simulatore: riceve un file dal "telefono" e lo rende scaricabile dal provider simulato (come la Media API di Meta).
import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { botConfig } from '../../../lib/bot/config';
import { simMedia } from '../../../lib/bot/provider';

export const POST: APIRoute = async ({ request }) => {
  if (!botConfig.simulatorEnabled) return new Response('Not found', { status: 404 });
  const f = (await request.formData()).get('file');
  if (!(f instanceof File) || f.size === 0 || f.size > 60 * 1024 * 1024) return new Response('Bad file', { status: 400 });
  const id = `sim-media-${randomUUID()}`;
  simMedia.put(id, new Uint8Array(await f.arrayBuffer()), f.type || 'application/octet-stream');
  return new Response(JSON.stringify({ id, mime: f.type }), { headers: { 'content-type': 'application/json' } });
};
// anteprima nel simulatore
export const GET: APIRoute = ({ url }) => {
  if (!botConfig.simulatorEnabled) return new Response('Not found', { status: 404 });
  const m = simMedia.get(url.searchParams.get('id') ?? '');
  if (!m) return new Response('Not found', { status: 404 });
  return new Response(m.bytes as BodyInit, { headers: { 'content-type': m.mime, 'cache-control': 'no-store' } });
};
