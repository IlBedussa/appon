// Struttura del vault documenti di un immobile: COPIA del modello "Drive di gestione" del sito
// (easybayit/src/lib/trust/drive-model.ts → DRIVE_FOLDERS e PORTAL_CATEGORY_TO_FOLDER).
// Stesse cartelle, stesso ordine, stesse icone e stesse azioni del registro attività, così che
// l'esempio pubblico sulla pagina Transparency Pledge e il portale reale coincidano.
// Se si cambia qui, aggiornare anche il sito (e viceversa).
//
// Da dove arrivano i contenuti di ogni cartella nel portale:
//   contracts   → documents (lease, other)              quotes      → quotes (+ documents collegati)
//   invoices    → documents (invoice)                   statements  → statements pubblicati (PDF generato)
//   inspections → inspections completate (+ PDF), documents (photo, report)
//   insurance   → documents (insurance, gas_safety, boiler_service)
//   utilities   → [DA CONFERMARE] nuova categoria documento 'utilities' (arnona, acqua, elettricità, gas)
//   tax         → [DA CONFERMARE] nuova categoria documento 'tax' (riepiloghi annuali per il commercialista)

export type VaultFolderId = 'contracts' | 'quotes' | 'invoices' | 'statements' | 'inspections' | 'insurance' | 'utilities' | 'tax';

export const VAULT_FOLDERS: { id: VaultFolderId; icon: string; tone: string }[] = [
  { id: 'contracts', icon: 'doc', tone: '#1a4fd6' },
  { id: 'quotes', icon: 'tool', tone: '#7c3aed' },
  { id: 'invoices', icon: 'wallet', tone: '#0f766e' },
  { id: 'statements', icon: 'chart', tone: '#0369a1' },
  { id: 'inspections', icon: 'eye', tone: '#b45309' },
  { id: 'insurance', icon: 'shield', tone: '#15803d' },
  { id: 'utilities', icon: 'pin', tone: '#be123c' },
  { id: 'tax', icon: 'key', tone: '#475569' },
];

/** doc_category del portale → cartella del vault. */
export const CATEGORY_TO_FOLDER: Record<string, VaultFolderId> = {
  lease: 'contracts', insurance: 'insurance', gas_safety: 'insurance', boiler_service: 'insurance',
  invoice: 'invoices', statement: 'statements', photo: 'inspections', report: 'inspections', other: 'contracts',
};

/** Azioni del registro attività per file (le stesse del sito); nel portale derivano da audit_log. */
export const VAULT_ACTIONS = ['uploaded', 'generated', 'viewed', 'approved', 'signed', 'acknowledged', 'paid', 'downloaded'] as const;
export type VaultAction = (typeof VAULT_ACTIONS)[number];

/** audit_log.action → azione del registro attività mostrata accanto al file. */
export const AUDIT_TO_VAULT_ACTION: Record<string, VaultAction> = {
  'documents.insert': 'uploaded', 'document.download': 'downloaded', 'statement.pdf_download': 'downloaded',
  'statements.update': 'generated', 'quote.approved': 'approved', 'inspection.acknowledged': 'acknowledged',
  'inspection.pdf_download': 'downloaded', 'inspection.photo_view': 'viewed', 'photo.view': 'viewed', 'report.pdf_download': 'downloaded',
};

export const folderForCategory = (c: string): VaultFolderId => CATEGORY_TO_FOLDER[c] ?? 'contracts';
