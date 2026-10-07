// Upload diretto dal browser a Supabase Storage (il file non passa dal server del portale).
// 1) POST /api/uploads/sign → URL firmati  2) PUT del file con XMLHttpRequest (barra di progresso)
// con ritentativi  3) il chiamante invia gli id al server, che verifica e collega i file (finalizzazione).
// Equivale a storage.uploadToSignedUrl di supabase-js, ma con l'avanzamento del caricamento.

export type Strings = Record<'preparing' | 'uploading' | 'done' | 'retrying' | 'failed' | 'tooBig' | 'badType' | 'tooMany' | 'forbidden' | 'saving', string>;
export interface UploadOpts {
  kind: string; targetId?: string | null; files: File[]; csrf: string; strings: Strings;
  limits: Record<string, number>; maxFiles: number;
  /** id già ottenuti per gli stessi File in un tentativo precedente (non si ricaricano) */
  done?: Map<File, string>;
  onFile?: (i: number, state: { pct?: number; text: string; error?: boolean }) => void;
}
export class UploadError extends Error {}

const fmt = (s: string, o: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(o[k] ?? ''));
const mb = (n: number) => `${Math.round(n / 1048576)} MB`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_TRIES = 3;
const BY_EXT: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', pdf: 'application/pdf' };
/** Tipo del file; alcuni browser lo lasciano vuoto (es. .mov su Windows): si deduce dall'estensione. */
export const typeOf = (f: File) => (f.type || BY_EXT[f.name.split('.').pop()?.toLowerCase() ?? ''] || '').toLowerCase();

/** Controlli preliminari (gli stessi del server, che resta l'autorità). */
export function precheck(o: Pick<UploadOpts, 'files' | 'limits' | 'maxFiles' | 'strings'>): string | null {
  if (o.files.length > o.maxFiles) return fmt(o.strings.tooMany, { n: o.maxFiles });
  for (const f of o.files) {
    const max = o.limits[typeOf(f)];
    if (!max) return fmt(o.strings.badType, { name: f.name });
    if (f.size > max) return fmt(o.strings.tooBig, { name: f.name, max: mb(max) });
  }
  return null;
}

type Signed = { ok: true; uploadId: string; signedUrl: string } | { ok: false; reason: string };
async function sign(o: UploadOpts, files: File[]): Promise<Signed[]> {
  let r: Response;
  try {
    r = await fetch('/api/uploads/sign', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': o.csrf },
      body: JSON.stringify({ kind: o.kind, targetId: o.targetId ?? null, files: files.map((f) => ({ name: f.name, size: f.size, type: typeOf(f) })) }),
    });
  } catch { throw new UploadError(o.strings.failed); }
  if (r.status === 403 || r.status === 404) throw new UploadError(o.strings.forbidden);
  const j = await r.json().catch(() => ({}));
  if (r.status === 422 && Array.isArray(j.files)) {
    const i = j.files.findIndex((x: Signed) => !x.ok && x.reason !== 'skipped');
    const f = files[Math.max(0, i)];
    const reason = i >= 0 ? j.files[i].reason : 'type';
    throw new UploadError(reason === 'size' ? fmt(o.strings.tooBig, { name: f.name, max: mb(o.limits[typeOf(f)] ?? 0) }) : fmt(o.strings.badType, { name: f.name }));
  }
  if (!r.ok || !Array.isArray(j.files)) throw new UploadError(o.strings.failed);
  return j.files;
}

function put(url: string, file: File, onPct: (p: number) => void): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const x = new XMLHttpRequest();
    x.open('PUT', url);
    x.setRequestHeader('content-type', typeOf(file));
    x.setRequestHeader('x-upsert', 'false');
    x.timeout = 15 * 60 * 1000;
    x.upload.onprogress = (e) => { if (e.lengthComputable) onPct(e.loaded / e.total); };
    x.onload = () => resolve({ status: x.status, body: x.responseText });
    x.onerror = x.ontimeout = x.onabort = () => resolve({ status: 0, body: '' });
    x.send(file);
  });
}

/** Esito di un PUT: lo storage risponde 400 con statusCode "409" se l'oggetto esiste già (caricamento riuscito
 *  ma risposta persa → va bene: la finalizzazione verifica comunque il contenuto). */
function outcome(r: { status: number; body: string }): 'ok' | 'retry' | 'expired' | 'fail' {
  if (r.status >= 200 && r.status < 300) return 'ok';
  if (r.status === 0 || r.status === 429 || r.status >= 500) return 'retry';
  let code = '', msg = '';
  try { const j = JSON.parse(r.body); code = String(j.statusCode ?? ''); msg = `${j.error ?? ''} ${j.message ?? ''}`; } catch { /* corpo non JSON */ }
  if (code === '409') return 'ok';
  if (/jwt|token|expired|signature/i.test(msg) || code === '403') return 'expired';
  return 'fail';
}

/** Carica i file e restituisce gli id degli upload (nello stesso ordine). Lancia UploadError con un messaggio già tradotto. */
export async function uploadFiles(o: UploadOpts): Promise<string[]> {
  const err = precheck(o);
  if (err) throw new UploadError(err);
  const done = o.done ?? new Map<File, string>();
  const todo = o.files.filter((f) => !done.has(f));
  o.files.forEach((f, i) => o.onFile?.(i, done.has(f) ? { pct: 1, text: o.strings.done } : { pct: 0, text: o.strings.preparing }));
  let signed = todo.length ? await sign(o, todo) : [];
  for (let k = 0; k < todo.length; k++) {
    const f = todo[k], i = o.files.indexOf(f);
    let s = signed[k];
    if (!s?.ok) throw new UploadError(o.strings.failed);
    let resigned = false;
    for (let attempt = 1; ; attempt++) {
      const r = await put(s.signedUrl, f, (p) => o.onFile?.(i, { pct: p, text: `${o.strings.uploading} ${Math.round(p * 100)}%` }));
      const out = outcome(r);
      if (out === 'ok') break;
      if (out === 'expired' && !resigned) { resigned = true; s = (await sign(o, [f]))[0]; if (!s?.ok) throw new UploadError(o.strings.failed); continue; }
      if (out === 'retry' && attempt < MAX_TRIES) {
        o.onFile?.(i, { pct: 0, text: fmt(o.strings.retrying, { n: attempt, max: MAX_TRIES - 1 }) });
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }
      o.onFile?.(i, { text: o.strings.failed, error: true });
      throw new UploadError(o.strings.failed);
    }
    done.set(f, s.uploadId);
    o.onFile?.(i, { pct: 1, text: o.strings.done });
  }
  return o.files.map((f) => done.get(f)!);
}

/** Campi file dei form ([data-du]): carica prima dell'invio e sostituisce i file con gli id (upload_ids). */
function enhance(wrap: HTMLElement) {
  const input = wrap.querySelector<HTMLInputElement>('input[type=file]');
  const form = input?.form;
  const list = wrap.querySelector<HTMLElement>('[data-du-list]');
  const status = wrap.querySelector<HTMLElement>('[data-du-status]');
  if (!input || !form || !list || !status) return;
  const strings = JSON.parse(wrap.dataset.duI18n!) as Strings;
  const limits = JSON.parse(wrap.dataset.duLimits!) as Record<string, number>;
  const maxFiles = Number(wrap.dataset.duMax);
  const csrf = form.querySelector<HTMLInputElement>('input[name=_csrf]')?.value ?? '';
  const done = new Map<File, string>();
  let busy = false;

  const render = (files: File[]) => {
    list.replaceChildren(...files.map((f) => {
      const li = document.createElement('li');
      const name = document.createElement('span'); name.className = 'du-name'; name.textContent = f.name;
      const bar = document.createElement('progress'); bar.max = 100; bar.value = 0;
      const st = document.createElement('small'); st.className = 'du-state';
      li.append(name, bar, st);
      return li;
    }));
  };
  input.addEventListener('change', () => { status.textContent = ''; render(Array.from(input.files ?? [])); });

  form.addEventListener('submit', async (e) => {
    if (form.dataset.duReady === '1') return;
    const files = Array.from(input.files ?? []);
    if (!files.length) return; // nessun file: invio normale
    e.preventDefault();
    if (busy) return;
    busy = true;
    const buttons = Array.from(form.querySelectorAll<HTMLButtonElement>('button[type=submit], button:not([type])'));
    buttons.forEach((b) => (b.disabled = true));
    status.removeAttribute('data-type');
    status.textContent = '';
    render(files);
    try {
      const ids = await uploadFiles({
        kind: wrap.dataset.duKind!, targetId: wrap.dataset.duTarget || null, files, csrf, strings, limits, maxFiles, done,
        onFile: (i, s) => {
          const li = list.children[i] as HTMLElement | undefined;
          if (!li) return;
          if (s.pct !== undefined) (li.querySelector('progress') as HTMLProgressElement).value = Math.round(s.pct * 100);
          (li.querySelector('.du-state') as HTMLElement).textContent = s.text;
          li.toggleAttribute('data-error', !!s.error);
        },
      });
      form.querySelectorAll('input[name=upload_ids]').forEach((n) => n.remove());
      for (const id of ids) {
        const h = document.createElement('input'); h.type = 'hidden'; h.name = 'upload_ids'; h.value = id; form.append(h);
      }
      input.disabled = true; // il contenuto dei file non viene inviato al server
      status.textContent = strings.saving;
      form.dataset.duReady = '1';
      form.submit();
    } catch (err) {
      status.dataset.type = 'error';
      status.textContent = err instanceof UploadError ? err.message : strings.failed;
      buttons.forEach((b) => (b.disabled = false));
      busy = false;
    }
  });
}

document.querySelectorAll<HTMLElement>('[data-du]').forEach(enhance);
