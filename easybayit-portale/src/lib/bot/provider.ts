// Astrazione del canale di uscita e del download dei media.
//  - cloud: Meta WhatsApp Cloud API (Graph API)
//  - simulator: nessuna rete; i messaggi in uscita restano nel DB e il simulatore li mostra
//  - webchat: come simulator (la chat del portale legge i messaggi dal DB)
import type { Outbound } from './types';

export interface ChatProvider {
  readonly name: 'cloud' | 'simulator' | 'webchat';
  send(to: string, msg: Outbound): Promise<{ id: string | null }>;
  downloadMedia(mediaId: string): Promise<{ bytes: Uint8Array; mime: string }>;
}

/** Archivio media del simulatore (solo sviluppo, in memoria del processo). */
const simStore: Map<string, { bytes: Uint8Array; mime: string }> = ((globalThis as any).__ebSimMedia ??= new Map());
export const simMedia = {
  put(id: string, bytes: Uint8Array, mime: string) { simStore.set(id, { bytes, mime }); if (simStore.size > 200) simStore.delete(simStore.keys().next().value!); },
  get: (id: string) => simStore.get(id),
};

export class LocalProvider implements ChatProvider {
  constructor(readonly name: 'simulator' | 'webchat') {}
  async send() { return { id: null }; }
  async downloadMedia(id: string) {
    const m = simStore.get(id);
    if (!m) throw new Error('media not found');
    return m;
  }
}

export class CloudProvider implements ChatProvider {
  readonly name = 'cloud' as const;
  constructor(private token: string, private phoneNumberId: string, private version = 'v21.0') {}
  private get base() { return `https://graph.facebook.com/${this.version}`; }

  async send(to: string, msg: Outbound) {
    // WhatsApp: max 3 pulsanti (titolo ≤ 20); oltre si usa una lista (≤ 10 righe, titolo ≤ 24); testo ≤ 1024 nei messaggi interattivi
    let body: any;
    const b = msg.buttons ?? [];
    if (b.length && b.length <= 3) {
      body = { type: 'interactive', interactive: { type: 'button', body: { text: msg.text.slice(0, 1024) }, action: { buttons: b.map((x) => ({ type: 'reply', reply: { id: x.id, title: x.title.slice(0, 20) } })) } } };
    } else if (b.length) {
      body = { type: 'interactive', interactive: { type: 'list', body: { text: msg.text.slice(0, 1024) }, action: { button: '☰', sections: [{ title: 'Options', rows: b.slice(0, 10).map((x) => ({ id: x.id, title: x.title.slice(0, 24) })) }] } } };
    } else body = { type: 'text', text: { body: msg.text.slice(0, 4096), preview_url: false } };
    const res = await fetch(`${this.base}/${this.phoneNumberId}/messages`, {
      method: 'POST', headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...body }),
    });
    if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const j = await res.json();
    return { id: j.messages?.[0]?.id ?? null };
  }

  async downloadMedia(mediaId: string) {
    // 1) metadati (URL temporaneo), 2) download con lo stesso token
    const meta = await fetch(`${this.base}/${encodeURIComponent(mediaId)}`, { headers: { authorization: `Bearer ${this.token}` } });
    if (!meta.ok) throw new Error(`media meta ${meta.status}`);
    const { url, mime_type } = await meta.json();
    const host = new URL(url).hostname;
    if (!/(^|\.)(fbcdn\.net|facebook\.com|whatsapp\.net)$/.test(host)) throw new Error('unexpected media host');
    const bin = await fetch(url, { headers: { authorization: `Bearer ${this.token}` } });
    if (!bin.ok) throw new Error(`media download ${bin.status}`);
    return { bytes: new Uint8Array(await bin.arrayBuffer()), mime: mime_type };
  }
}
