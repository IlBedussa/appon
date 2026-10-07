// Modello riutilizzabile del "Drive di gestione" di un immobile.
// Usato oggi dal sito (esempio interattivo sulla pagina Transparency Pledge) e pensato per essere
// rispecchiato 1:1 dal vault documenti del portale (stesse cartelle, stesso ordine, stesse azioni
// del registro attività). Il portale ha una copia di questa struttura in
// easybayit-portal/src/lib/vault-structure.ts con la mappatura doc_category → cartella.
//
// Regole: nessun dato reale. I file di esempio sono generati da scripts/trust/make-samples.mjs,
// tutti con filigrana EXAMPLE / ESEMPIO / דוגמה / EXEMPLE.

export type DriveFolderId =
  | 'contracts' | 'quotes' | 'invoices' | 'statements' | 'inspections' | 'insurance' | 'utilities' | 'tax';

/** Ordine e icone delle cartelle principali (identici nel portale). */
export const DRIVE_FOLDERS: { id: DriveFolderId; icon: string; tone: string }[] = [
  { id: 'contracts', icon: 'doc', tone: '#1a4fd6' },
  { id: 'quotes', icon: 'tool', tone: '#7c3aed' },
  { id: 'invoices', icon: 'wallet', tone: '#0f766e' },
  { id: 'statements', icon: 'chart', tone: '#0369a1' },
  { id: 'inspections', icon: 'eye', tone: '#b45309' },
  { id: 'insurance', icon: 'shield', tone: '#15803d' },
  { id: 'utilities', icon: 'pin', tone: '#be123c' },
  { id: 'tax', icon: 'key', tone: '#475569' },
];

/** Mappatura delle categorie documento del portale (enum public.doc_category) verso le cartelle. */
export const PORTAL_CATEGORY_TO_FOLDER: Record<string, DriveFolderId> = {
  lease: 'contracts', insurance: 'insurance', gas_safety: 'insurance', boiler_service: 'insurance',
  invoice: 'invoices', statement: 'statements', photo: 'inspections', report: 'inspections', other: 'contracts',
};

export type DriveActor = 'staff' | 'manager' | 'owner' | 'tenant' | 'contractor' | 'system';
export type DriveAction = 'uploaded' | 'generated' | 'viewed' | 'approved' | 'signed' | 'acknowledged' | 'paid' | 'downloaded';

export interface DriveActivity { action: DriveAction; who: DriveActor; at: string /* ISO 8601 con offset */ }

export interface DriveSubfolder { id: string; parent: DriveFolderId; /** chiave del titolo nel dizionario */ titleKey: string; date: string }

export interface DriveFile {
  id: string;
  /** cartella principale o sottocartella (DriveSubfolder.id) */
  folder: string;
  kind: 'pdf' | 'image';
  /** true = esiste una versione per lingua (/samples/drive/{lang}/{id}.pdf), altrimenti unica (lingua originale) */
  localized?: boolean;
  /** lingua originale dei documenti di terzi */
  original?: 'he-en' | 'en' | 'he';
  /** data del documento (ISO) */
  date: string;
  pages?: number;
  /** importo mostrato nell'elenco (ILS) — solo per preventivi/fatture */
  amountIls?: number;
  /** preventivo scelto (evidenziato) */
  chosen?: boolean;
  activity: DriveActivity[];
}

export interface DriveModel { subfolders: DriveSubfolder[]; files: DriveFile[] }

/** Percorsi degli asset (pdf/immagine + anteprime pagina) di un file. */
export function driveAssets(f: DriveFile, lang: string) {
  const base = f.localized ? `/samples/drive/${lang}/${f.id}` : `/samples/drive/${f.id}`;
  if (f.kind === 'image') return { file: `${base}.jpg`, pages: [`${base}.jpg`], thumb: `${base}-thumb.jpg` };
  const n = f.pages ?? 1;
  return { file: `${base}.pdf`, pages: Array.from({ length: n }, (_, i) => `${base}-p${i + 1}.jpg`), thumb: `${base}-p1.jpg` };
}
