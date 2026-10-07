// ESEMPIO del Drive di gestione per UN immobile fittizio ("Rehov HaDugma 12", Gerusalemme).
// Tutti i nomi (persone, aziende, assicurazione) sono FITTIZI; importi e date sono di ESEMPIO.
// Le tariffe di gestione usate nei rendiconti seguono il listino di esempio (Full 10% + IVA) [DA CONFERMARE].
// Le anteprime e i PDF sono generati da scripts/trust/make-samples.mjs (stessi id).
import type { DriveModel } from '../../lib/trust/drive-model';

export const EXAMPLE_PROPERTY = {
  rentIls: 7200,
  feePct: 10, // listino di esempio "Full" [DA CONFERMARE]
  vat: 0.18,
  leaseStart: '2026-04-01',
  leaseEnd: '2027-03-31',
};

const up = (who: 'staff' | 'manager' | 'system' | 'contractor', at: string) => ({ action: 'uploaded' as const, who, at });
const seen = (who: 'owner' | 'tenant', at: string) => ({ action: 'viewed' as const, who, at });

export const exampleDrive: DriveModel = {
  subfolders: [
    { id: 'quotes-heater', parent: 'quotes', titleKey: 'jobHeater', date: '2026-08-06' },
    { id: 'quotes-leak', parent: 'quotes', titleKey: 'jobLeak', date: '2026-07-08' },
  ],
  files: [
    // --- Contratti ---
    { id: 'lease-agreement', folder: 'contracts', kind: 'pdf', original: 'he-en', date: '2026-03-18', pages: 2,
      activity: [up('manager', '2026-03-18T17:42:00+02:00'), { action: 'signed', who: 'tenant', at: '2026-03-18T16:05:00+02:00' }, { action: 'signed', who: 'owner', at: '2026-03-18T21:10:00+02:00' }, seen('owner', '2026-03-19T08:31:00+02:00')] },
    { id: 'management-agreement', folder: 'contracts', kind: 'pdf', original: 'en', date: '2026-02-20',
      activity: [up('staff', '2026-02-20T11:15:00+02:00'), { action: 'signed', who: 'owner', at: '2026-02-21T19:02:00+02:00' }] },
    { id: 'tenant-guarantee', folder: 'contracts', kind: 'pdf', original: 'he-en', date: '2026-03-25',
      activity: [up('manager', '2026-03-25T10:20:00+02:00'), seen('owner', '2026-03-25T22:48:00+02:00')] },

    // --- Preventivi: sempre 3 per lavoro, quello scelto evidenziato ---
    { id: 'quote-heater-a', folder: 'quotes-heater', kind: 'pdf', original: 'he-en', date: '2026-08-06', amountIls: 3900, chosen: true,
      activity: [up('staff', '2026-08-06T12:10:00+03:00'), seen('owner', '2026-08-06T19:40:00+03:00'), { action: 'approved', who: 'owner', at: '2026-08-06T19:44:00+03:00' }] },
    { id: 'quote-heater-b', folder: 'quotes-heater', kind: 'pdf', original: 'he-en', date: '2026-08-06', amountIls: 4350,
      activity: [up('staff', '2026-08-06T12:11:00+03:00'), seen('owner', '2026-08-06T19:41:00+03:00')] },
    { id: 'quote-heater-c', folder: 'quotes-heater', kind: 'pdf', original: 'he-en', date: '2026-08-06', amountIls: 3650,
      activity: [up('staff', '2026-08-06T12:12:00+03:00'), seen('owner', '2026-08-06T19:42:00+03:00')] },
    { id: 'quote-leak-a', folder: 'quotes-leak', kind: 'pdf', original: 'he-en', date: '2026-07-08', amountIls: 1450,
      activity: [up('staff', '2026-07-08T09:30:00+03:00'), seen('owner', '2026-07-08T13:02:00+03:00')] },
    { id: 'quote-leak-b', folder: 'quotes-leak', kind: 'pdf', original: 'he-en', date: '2026-07-08', amountIls: 980, chosen: true,
      activity: [up('staff', '2026-07-08T09:31:00+03:00'), seen('owner', '2026-07-08T13:03:00+03:00'), { action: 'approved', who: 'owner', at: '2026-07-08T13:05:00+03:00' }] },
    { id: 'quote-leak-c', folder: 'quotes-leak', kind: 'pdf', original: 'he-en', date: '2026-07-08', amountIls: 1200,
      activity: [up('staff', '2026-07-08T09:33:00+03:00'), seen('owner', '2026-07-08T13:03:00+03:00')] },

    // --- Fatture e ricevute (originali del fornitore, nessun ricarico) ---
    { id: 'invoice-heater', folder: 'invoices', kind: 'pdf', original: 'he-en', date: '2026-08-14', amountIls: 3900,
      activity: [up('staff', '2026-08-14T16:20:00+03:00'), { action: 'paid', who: 'staff', at: '2026-08-16T10:00:00+03:00' }, seen('owner', '2026-08-16T20:15:00+03:00')] },
    { id: 'invoice-leak', folder: 'invoices', kind: 'pdf', original: 'he-en', date: '2026-07-09', amountIls: 980,
      activity: [up('staff', '2026-07-09T15:45:00+03:00'), { action: 'paid', who: 'staff', at: '2026-07-10T09:12:00+03:00' }, seen('owner', '2026-07-10T18:30:00+03:00')] },
    { id: 'receipt-leak', folder: 'invoices', kind: 'pdf', original: 'he-en', date: '2026-07-10', amountIls: 980,
      activity: [up('contractor', '2026-07-10T09:40:00+03:00'), seen('owner', '2026-07-10T18:31:00+03:00')] },
    { id: 'receipt-vaad', folder: 'invoices', kind: 'pdf', original: 'he-en', date: '2026-09-07', amountIls: 450,
      activity: [up('staff', '2026-09-07T11:05:00+03:00'), seen('owner', '2026-09-08T07:55:00+03:00')] },

    // --- Rendiconti e report mensili (generati dal portale, nella lingua del proprietario) ---
    { id: 'health-report-2026-09', folder: 'statements', kind: 'pdf', localized: true, date: '2026-10-01', pages: 2,
      activity: [{ action: 'generated', who: 'system', at: '2026-10-01T06:00:00+03:00' }, seen('owner', '2026-10-01T09:12:00+03:00')] },
    { id: 'statement-2026-09', folder: 'statements', kind: 'pdf', localized: true, date: '2026-10-01',
      activity: [{ action: 'generated', who: 'system', at: '2026-10-01T06:00:00+03:00' }, seen('owner', '2026-10-01T09:10:00+03:00'), { action: 'downloaded', who: 'owner', at: '2026-10-01T09:11:00+03:00' }] },
    { id: 'statement-2026-08', folder: 'statements', kind: 'pdf', localized: true, date: '2026-09-01',
      activity: [{ action: 'generated', who: 'system', at: '2026-09-01T06:00:00+03:00' }, seen('owner', '2026-09-01T08:40:00+03:00')] },
    { id: 'statement-2026-07', folder: 'statements', kind: 'pdf', localized: true, date: '2026-08-01',
      activity: [{ action: 'generated', who: 'system', at: '2026-08-01T06:00:00+03:00' }, seen('owner', '2026-08-02T10:05:00+03:00')] },

    // --- Ispezioni: report + foto con data e ora ---
    { id: 'inspection-move-in', folder: 'inspections', kind: 'pdf', localized: true, date: '2026-03-31', pages: 2,
      activity: [{ action: 'generated', who: 'system', at: '2026-03-31T11:02:00+03:00' }, { action: 'acknowledged', who: 'tenant', at: '2026-03-31T11:20:00+03:00' }, { action: 'acknowledged', who: 'owner', at: '2026-03-31T20:47:00+03:00' }] },
    { id: 'photo-living', folder: 'inspections', kind: 'image', date: '2026-03-31T10:04:00+03:00', activity: [up('manager', '2026-03-31T10:04:00+03:00'), seen('owner', '2026-03-31T20:40:00+03:00')] },
    { id: 'photo-kitchen', folder: 'inspections', kind: 'image', date: '2026-03-31T10:11:00+03:00', activity: [up('manager', '2026-03-31T10:11:00+03:00'), seen('owner', '2026-03-31T20:41:00+03:00')] },
    { id: 'photo-bathroom', folder: 'inspections', kind: 'image', date: '2026-03-31T10:18:00+03:00', activity: [up('manager', '2026-03-31T10:18:00+03:00'), seen('owner', '2026-03-31T20:42:00+03:00')] },
    { id: 'photo-bedroom', folder: 'inspections', kind: 'image', date: '2026-03-31T10:25:00+03:00', activity: [up('manager', '2026-03-31T10:25:00+03:00'), seen('owner', '2026-03-31T20:43:00+03:00')] },
    { id: 'photo-balcony', folder: 'inspections', kind: 'image', date: '2026-03-31T10:31:00+03:00', activity: [up('manager', '2026-03-31T10:31:00+03:00'), seen('owner', '2026-03-31T20:44:00+03:00')] },
    { id: 'photo-meters', folder: 'inspections', kind: 'image', date: '2026-03-31T10:36:00+03:00', activity: [up('manager', '2026-03-31T10:36:00+03:00'), seen('tenant', '2026-03-31T11:18:00+03:00')] },
    { id: 'photo-heater', folder: 'inspections', kind: 'image', date: '2026-08-14T15:52:00+03:00', activity: [up('contractor', '2026-08-14T15:52:00+03:00'), seen('owner', '2026-08-14T21:05:00+03:00')] },

    // --- Assicurazioni e certificati ---
    { id: 'insurance-building', folder: 'insurance', kind: 'pdf', original: 'he-en', date: '2026-01-01',
      activity: [up('staff', '2026-02-22T10:00:00+02:00'), seen('owner', '2026-02-22T21:30:00+02:00')] },
    { id: 'insurance-liability', folder: 'insurance', kind: 'pdf', original: 'he-en', date: '2026-04-01',
      activity: [up('staff', '2026-03-30T14:22:00+03:00'), seen('owner', '2026-03-30T22:01:00+03:00')] },
    { id: 'gas-certificate', folder: 'insurance', kind: 'pdf', original: 'he-en', date: '2026-03-29',
      activity: [up('contractor', '2026-03-29T12:40:00+03:00'), seen('owner', '2026-03-29T19:12:00+03:00')] },
    { id: 'heater-warranty', folder: 'insurance', kind: 'pdf', original: 'he-en', date: '2026-08-14',
      activity: [up('staff', '2026-08-14T16:25:00+03:00'), seen('owner', '2026-08-16T20:16:00+03:00')] },

    // --- Arnona e utenze ---
    { id: 'arnona-transfer', folder: 'utilities', kind: 'pdf', original: 'he', date: '2026-04-03',
      activity: [up('staff', '2026-04-03T13:10:00+03:00'), seen('owner', '2026-04-03T20:02:00+03:00')] },
    { id: 'water-transfer', folder: 'utilities', kind: 'pdf', original: 'he', date: '2026-04-05',
      activity: [up('staff', '2026-04-05T09:44:00+03:00'), seen('owner', '2026-04-05T19:30:00+03:00')] },
    { id: 'electricity-transfer', folder: 'utilities', kind: 'pdf', original: 'he', date: '2026-04-02',
      activity: [up('staff', '2026-04-02T16:00:00+03:00'), seen('owner', '2026-04-02T21:15:00+03:00')] },

    // --- Fiscale ---
    { id: 'tax-summary-2026', folder: 'tax', kind: 'pdf', localized: true, date: '2026-10-01',
      activity: [{ action: 'generated', who: 'system', at: '2026-10-01T06:05:00+03:00' }, seen('owner', '2026-10-01T09:15:00+03:00')] },
  ],
};
