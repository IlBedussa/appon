// Dati di mercato PUBBLICI usati nel sito, ciascuno con fonte e data.
// REGOLA: nessun numero senza fonte. Se un dato non è pubblicato, lo si dichiara (null).
// Verificati il 02/10/2026 sulle fonti indicate (vedi docs/ricerca-mercato.md).

export interface Source { id: string; label: string; publisher: string; url: string; date: string; checked?: string; official?: boolean }

export const sources = {
  cbsRentQ1_2026: {
    id: 'cbsRentQ1_2026',
    label: 'CBS average rents, Q1 2026 (reported by Ynet)',
    publisher: 'Central Bureau of Statistics via Ynet News',
    url: 'https://www.ynetnews.com/real-estate/article/hjekp6kgzx',
    date: '2026-05',
  },
  cbsRoomsQ1_2025: {
    id: 'cbsRoomsQ1_2025',
    label: 'CBS average rents by apartment size, Q1 2025 (reported by BuyItInIsrael)',
    publisher: 'Central Bureau of Statistics via BuyItInIsrael',
    url: 'https://www.buyitinisrael.com/news/average-rent-israel/',
    date: '2025-05',
  },
  mofForeignBuyers2025: {
    id: 'mofForeignBuyers2025',
    label: 'Home purchases by foreign residents, 2025 (Ministry of Finance survey, reported by Globes)',
    publisher: 'Ministry of Finance via Globes',
    url: 'https://en.globes.co.il/en/article-strong-shekel-hits-home-purchases-by-foreign-residents-1001548068',
    date: '2026-07-06',
  },
  kolZchutRentTax: {
    id: 'kolZchutRentTax',
    label: 'Tax exemption on residential rental income (Kol Zchut)',
    publisher: 'Kol Zchut',
    url: 'https://www.kolzchut.org.il/he/פטור_ממס_על_הכנסה_מהשכרת_דירה_למגורים',
    date: '2026',
  },
  nonResidentManager: {
    id: 'nonResidentManager',
    label: 'Hiring a property manager as a non-resident landlord (IsraelNonResident)',
    publisher: 'IsraelNonResident (Adv. Eli Shimony)',
    url: 'https://israelnonresident.com/property/rental-management/hiring-property-manager-israel-non-resident-landlord/',
    date: '2026',
  },
  withholding2513: {
    id: 'withholding2513',
    label: 'Rent paid to a foreign resident: withholding and Form 2513 (David Melnik Law)',
    publisher: 'David Melnik Law',
    url: 'https://www.melnik.org.il/en/withholding-rent-foreign-resident-israel/',
    date: '2026',
  },
  feesAgencyTlv: {
    id: 'feesAgencyTlv',
    label: 'Property management fees in Israel 2026 (The Agency TLV)',
    publisher: 'The Agency TLV',
    url: 'https://theagencytlv.com/property-management-fees-israel-2026/',
    date: '2026',
  },
  feesFlamingo: {
    id: 'feesFlamingo',
    label: 'Flamingo public pricing',
    publisher: 'Flamingo',
    url: 'https://flamingo-h.co.il/en/investors/pricing',
    date: '2026-10-02',
  },
  feesKaufman: {
    id: 'feesKaufman',
    label: 'Kaufman Realty property management packages',
    publisher: 'Kaufman Realty',
    url: 'https://kaufmanrlty.com/property-management/',
    date: '2026-10-02',
  },
  boiRates: {
    id: 'boiRates',
    label: 'Bank of Israel representative exchange rates',
    publisher: 'Bank of Israel',
    url: 'https://www.boi.org.il/en/economic-roles/financial-markets/exchange-rates/',
    date: 'live',
  },
  streets: {
    id: 'streets',
    label: 'List of streets in Israel (Population and Immigration Authority, data.gov.il)',
    publisher: 'Population and Immigration Authority via data.gov.il',
    url: 'https://data.gov.il/dataset/321',
    date: 'live',
  },
  // ——— Fonti UFFICIALI per la sezione Legale & Fiscale (verificate il 02/10/2026) ———
  itaBooklet2026: {
    id: 'itaBooklet2026',
    label: 'Monthly deductions booklet 2026 — rental income exemption ceiling (Israel Tax Authority)',
    publisher: 'Israel Tax Authority (gov.il)',
    url: 'https://www.gov.il/BlobFolder/generalpage/income-tax-monthly-deductions-booklet/he/generalInformation_income-tax-monthly-deductions-booklet_monthly-deductions-booklet-2026.pdf',
    date: '2026', checked: '2026-10-02', official: true,
  },
  ita122: {
    id: 'ita122',
    label: 'Section 122 of the Income Tax Ordinance — 10% track on residential rent (Israel Tax Authority)',
    publisher: 'Israel Tax Authority (gov.il)',
    url: 'https://www.gov.il/BlobFolder/dynamiccollectorresultitem/represent-info-281223/he/IncomeTax_IncomeTaxRepresentInfo_represent-info-281223.pdf',
    date: '2023', checked: '2026-10-02', official: true,
  },
  knesset122: {
    id: 'knesset122',
    label: 'Income Tax Ordinance (Amendment No. 159), 2007 — text published by the Knesset',
    publisher: 'Knesset — Sefer HaChukim',
    url: 'https://fs.knesset.gov.il/17/law/17_lsr_300762.pdf',
    date: '2007', checked: '2026-10-02', official: true,
  },
  itaRights2024: {
    id: 'itaRights2024',
    label: 'Your rights and obligations 2024 — income tax guide (Israel Tax Authority)',
    publisher: 'Israel Tax Authority (gov.il)',
    url: 'https://www.gov.il/BlobFolder/generalpage/income-tax-guide-knowyourright/he/Guides_IncomeTax_da-2024.pdf',
    date: '2024', checked: '2026-10-02', official: true,
  },
  itaWithholding2026: {
    id: 'itaWithholding2026',
    label: 'Income Tax Directive 02/2026 — withholding approvals for 2026, incl. rent (Israel Tax Authority)',
    publisher: 'Israel Tax Authority (gov.il)',
    url: 'https://www.gov.il/BlobFolder/policy/inst-02-2026/he/IncomeTax_inst-02-2026.pdf',
    date: '2026', checked: '2026-10-02', official: true,
  },
  itaVat18: {
    id: 'itaVat18',
    label: 'VAT interpretation directive 01/2025 — VAT rate raised from 17% to 18% on 1 Jan 2025 (Israel Tax Authority)',
    publisher: 'Israel Tax Authority (gov.il)',
    url: 'https://www.gov.il/BlobFolder/dynamiccollectorresultitem/represent-info-051224-2/he/vat_represent-info-051224-2.pdf',
    date: '2024-12-05', checked: '2026-10-02', official: true,
  },
  itaRealEstateSimulator: {
    id: 'itaRealEstateSimulator',
    label: 'Real estate tax simulator — purchase tax (Israel Tax Authority)',
    publisher: 'Israel Tax Authority (gov.il)',
    url: 'https://www.gov.il/he/service/real_eatate_taxsimulator',
    date: 'live', checked: '2026-10-02', official: true,
  },
  knessetFairRental2017: {
    id: 'knessetFairRental2017',
    label: 'Rental and Borrowing Law (Amendment No. 2), 2017 — “Fair Rental Law” — text published by the Knesset',
    publisher: 'Knesset — Sefer HaChukim',
    url: 'https://fs.knesset.gov.il/20/law/20_lsr_389390.pdf',
    date: '2017', checked: '2026-10-02', official: true,
  },
  govFairRentalBroker: {
    id: 'govFairRentalBroker',
    label: 'Fair Rental Law — consolidated file for real estate brokers (gov.il)',
    publisher: 'Ministry of Justice — Real Estate Brokers Council (gov.il)',
    url: 'https://www.gov.il/BlobFolder/news/rent_law/he/Broker_File_rental%20_law.pdf',
    date: '2017', checked: '2026-10-02', official: true,
  },
  kolZchutEviction: {
    id: 'kolZchutEviction',
    label: 'Expedited eviction of a tenant (Kol Zchut — non-governmental summary; official text: Civil Procedure Regulations 2018, reg. 81)',
    publisher: 'Kol Zchut',
    url: 'https://www.kolzchut.org.il/he/%D7%A4%D7%99%D7%A0%D7%95%D7%99_%D7%93%D7%99%D7%99%D7%A8_(%D7%A9%D7%95%D7%9B%D7%A8)_%D7%9E%D7%93%D7%99%D7%A8%D7%94_%D7%9E%D7%95%D7%A9%D7%9B%D7%A8%D7%AA_%D7%91%D7%94%D7%9C%D7%99%D7%9A_%D7%9E%D7%94%D7%99%D7%A8_%D7%95%D7%9E%D7%96%D7%95%D7%A8%D7%96',
    date: '2026', checked: '2026-10-02', official: false,
  },
  ppaAmendment13: {
    id: 'ppaAmendment13',
    label: 'Amendment No. 13 to the Protection of Privacy Law — professional guide (Privacy Protection Authority)',
    publisher: 'Privacy Protection Authority, Ministry of Justice (gov.il)',
    url: 'https://www.gov.il/he/pages/guide_tikon13_professional',
    date: '2025-08-14', checked: '2026-10-02', official: true,
  },
  accessibilityRegs2013: {
    id: 'accessibilityRegs2013',
    label: 'Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations, 2013 (gov.il)',
    publisher: 'Commission for Equal Rights of Persons with Disabilities (gov.il)',
    url: 'https://www.gov.il/BlobFolder/guide/accommodating_service_providing_rules/he/sitedocs_service_acessibility_regulations.pdf',
    date: '2013', checked: '2026-10-02', official: true,
  },
  si5568: {
    id: 'si5568',
    label: 'Israeli Standard SI 5568 part 1 — web content accessibility (gov.il)',
    publisher: 'Commission for Equal Rights of Persons with Disabilities (gov.il)',
    url: 'https://www.gov.il/BlobFolder/legalinfo/israeli_accessibility_standards_pdf/he/sitedocs_si-5568-1-september-2023.pdf',
    date: '2023-09', checked: '2026-10-02', official: true,
  },
} satisfies Record<string, Source>;
export type SourceId = keyof typeof sources;

/** Affitto medio mensile (₪), CBS 1° trimestre 2026 [cbsRentQ1_2026]. */
export const rentQ1_2026 = {
  national: 5027,
  yoyPct: 3.5,
  cities: {
    'tel-aviv': 7351,
    herzliya: 6647,
    'kfar-saba': 6054,
    'ramat-gan': 5826,
    jerusalem: 5280,
    'rishon-lezion': 5184,
    'petah-tikva': 5051,
    holon: 4885,
    rehovot: 4870,
    'beit-shemesh': 4782,
    netanya: 4729,
    ashdod: 4402,
    'bnei-brak': 4397,
    'bat-yam': 4348,
    hadera: 3978,
    ashkelon: 3638,
    haifa: 3384,
    beersheba: 3131,
  } as Record<string, number>,
  /** Media per distretto (usata come ripiego dichiarato se la città non è pubblicata). */
  districts: { north: 3232, south: 3632, haifa: 3665, jerusalem: 5232, center: 5386, 'tel-aviv': 6338 } as Record<string, number>,
};

/** Affitto medio nazionale per dimensione (₪), CBS 1° trim. 2025 [cbsRoomsQ1_2025]. */
export const roomsQ1_2025 = {
  national: 4853,
  groups: [
    { id: '1-2', min: 1, max: 2, avg: 3706 },
    { id: '2.5-3', min: 2.5, max: 3, avg: 4323 },
    { id: '3.5-4', min: 3.5, max: 4, avg: 5286 },
    { id: '4.5-6', min: 4.5, max: 6, avg: 6815 },
  ],
};

/** Acquisti di abitazioni da residenti esteri nel 2025 [mofForeignBuyers2025]. */
export const foreignBuyers2025: Record<string, number | null> = {
  jerusalem: 684,
  'tel-aviv': 186,
  netanya: 169,
  'beit-shemesh': 137,
  raanana: null, // non pubblicato nella fonte
};
/** Altri dati della stessa fonte [mofForeignBuyers2025]. */
export const jerusalemUnsoldNew = 10000; // "oltre 10.000" appartamenti nuovi invenduti

/** Città con pagina dedicata: affitto CBS (null = non pubblicato) e distretto di ripiego. */
export const cityData: Record<string, { rent: number | null; district: string; cbsCode: number }> = {
  jerusalem: { rent: 5280, district: 'jerusalem', cbsCode: 3000 },
  'beit-shemesh': { rent: 4782, district: 'jerusalem', cbsCode: 2610 },
  raanana: { rent: null, district: 'center', cbsCode: 8700 },
  netanya: { rent: 4729, district: 'center', cbsCode: 7400 },
  'tel-aviv': { rent: 7351, district: 'tel-aviv', cbsCode: 5000 },
};

/** IVA in Israele dal 1/1/2025. */
export const VAT = 0.18;
