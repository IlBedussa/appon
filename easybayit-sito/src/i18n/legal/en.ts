// Hub "Legal & Tax" — testi inglesi (modello di tipo). REGOLE: ogni affermazione legale/fiscale cita una fonte
// ufficiale (src/data/market.ts) con data di verifica; nessuna cifra inventata; i punti incerti sono marcati V.
const V = '[TO VERIFY]';
const P = '[TO CONFIRM]';
const L = '[TO CONFIRM with lawyer]';

const en = {
  V, P, L,
  nav: 'Legal & Tax',
  meta: {
    title: 'Legal & tax guide for property owners in Israel · Easybayit',
    description: 'Rental income tax tracks, withholding for foreign owners, VAT, Fair Rental Law, leases, eviction, privacy and accessibility — with official sources.',
  },
  eyebrow: 'Legal & Tax hub',
  h1: 'The legal and tax framework, explained precisely.',
  lead: 'What every owner of a rented apartment in Israel should know — residents and non-residents alike. Each statement links to the official source, with the date we last checked it.',
  disclaimer: 'General information, not legal or tax advice. Rules change and depend on your personal situation: consult a licensed Israeli lawyer or accountant (and a tax adviser in your country of residence) before acting.',
  verifyNote: `Items marked ${V} are being verified with professionals before publication.`,
  tocTitle: 'Contents',
  sourcesTitle: 'Official sources',
  lastReview: 'Content last reviewed: 2 October 2026',
  sections: [
    {
      id: 'rental-tax', icon: 'wallet', title: 'Tax on rental income: the three tracks',
      items: [
        { h: 'Exempt track', p: 'Residential rent received by an individual can be fully exempt when total monthly rent from all residential apartments does not exceed the ceiling — ₪5,654 per month for 2026 according to the Israel Tax Authority. Above the ceiling a reduced (partial) exemption applies up to twice the ceiling; beyond that there is no exemption. Conditions include residential use by the tenant.' },
        { h: '10% track (section 122)', p: 'A flat 10% tax on gross residential rent, with no deduction of expenses or depreciation. The tax is paid within 30 days after the end of the tax year in which the rent was received.' },
        { h: 'Regular (marginal) track', p: 'Rent is added to your other taxable income and taxed at your marginal rates; in exchange, expenses such as interest, repairs, management fees and depreciation may be deducted.' },
        { h: 'Residents vs non-residents', p: `Foreign residents are taxed in Israel on Israeli-source rent. Which tracks are available to a non-resident, how personal credit points apply, and how the home country credits Israeli tax under a tax treaty must be checked case by case ${V}.` },
      ],
      sources: ['itaBooklet2026', 'ita122', 'itaRights2024'],
    },
    {
      id: 'withholding', icon: 'doc', title: 'Withholding and reporting for foreign owners',
      items: [
        { h: 'Withholding at source', p: `Rent paid to a foreign resident may be subject to tax withholding by the payer unless an approval for a reduced rate or exemption is obtained from the assessing officer. The Israel Tax Authority’s directive for 2026 sets the procedure for withholding approvals, including for rent. Applicable rates ${V}.` },
        { h: 'Reporting', p: `Choosing the 10% track requires reporting and payment to the Tax Authority; other tracks are reported in the annual return. Whether a non-resident must file an annual return depends on the track and other income ${V}.` },
        { h: 'Transfers abroad', p: `Banks may ask for tax documents before transferring rent abroad ${V}. We keep the documents ready in the owner portal.` },
      ],
      sources: ['itaWithholding2026', 'itaRights2024'],
    },
    {
      id: 'vat', icon: 'chart', title: 'VAT on management fees',
      items: [
        { h: 'Rate', p: 'The standard VAT rate in Israel has been 18% since 1 January 2025. Management fees invoiced by an Israeli business are subject to VAT; that is why our prices are shown with VAT included.' },
        { h: 'Rent itself', p: `Residential rent received by a private individual is generally not subject to VAT ${V}. Special rules may apply to services supplied to foreign residents ${V}.` },
      ],
      sources: ['itaVat18'],
    },
    {
      id: 'purchase-sale', icon: 'key', title: 'Purchase tax and capital gains (investors)',
      items: [
        { h: 'Purchase tax (mas rechisha)', p: 'Rates depend on the value and on whether the property is your only residential apartment; brackets are updated periodically. Use the Tax Authority’s official simulator for the current amount rather than rules of thumb.' },
        { h: 'Land appreciation tax (mas shevach)', p: `On sale, the gain is subject to land appreciation tax unless an exemption applies. Exemptions for a single residential apartment have conditions that differ for residents and foreign residents ${V}. The rental tax track chosen over the years can affect the calculation on sale (e.g. depreciation) ${V}.` },
      ],
      sources: ['itaRealEstateSimulator'],
    },
    {
      id: 'fair-rental', icon: 'shield', title: 'The Fair Rental Law (2017)',
      items: [
        { h: 'Scope', p: `The 2017 amendment to the Rental and Borrowing Law applies to most residential leases; it excludes, among others, leases of up to 3 months with no option to extend and leases above a monthly rent threshold (₪20,000, indexed) ${V}.` },
        { h: 'Habitability', p: 'The landlord must deliver an apartment fit for habitation and in proper condition, as set out in the law and its schedule, and a written lease containing the required details.' },
        { h: 'Repairs', p: 'The landlord must repair defects that are not caused by the tenant’s unreasonable use within a reasonable time and no later than 30 days from the tenant’s request — or 3 days for a defect that prevents reasonable living.' },
        { h: 'Guarantees and deposits', p: 'Guarantees involving a monetary outlay by the tenant are capped at the lower of three months’ rent or one third of the rent for the whole lease period, and may be used only for the purposes set by law.' },
        { h: 'Costs the tenant cannot be charged', p: `Certain costs remain with the landlord, such as building insurance and a broker’s fee when the broker was engaged by the landlord ${V}.` },
      ],
      sources: ['knessetFairRental2017', 'govFairRentalBroker'],
    },
    {
      id: 'lease', icon: 'doc', title: 'Lease essentials',
      items: [
        { h: 'In writing, in a language you understand', p: 'A written lease is required for leases covered by the Fair Rental Law. If you do not read Hebrew, ask for a translation and keep both versions.' },
        { h: 'Clauses to check', p: `Duration and options; indexation; guarantees (within the legal cap); who pays arnona, va’ad bayit and utilities; condition report with photos; entry for repairs; early termination; notice periods ${V}.` },
      ],
      sources: ['knessetFairRental2017'],
    },
    {
      id: 'eviction', icon: 'alert', title: 'Eviction: process overview',
      items: [
        { h: 'Court procedure only', p: `Eviction of a tenant goes through an expedited claim at the Magistrates’ Court under the Civil Procedure Regulations (2018). The expedited claim is for eviction only; monetary claims are filed separately. Self-help (changing locks, cutting utilities) is not allowed ${V}.` },
        { h: 'Enforcement', p: 'If the tenant does not leave after a judgment, the judgment is enforced through the Enforcement and Collection Authority.' },
      ],
      sources: ['kolZchutEviction'],
      note: `Official regulation text to be linked after review ${V}.`,
    },
    {
      id: 'arnona-vaad', icon: 'pin', title: 'Arnona and va’ad bayit',
      items: [
        { h: 'Arnona (municipal tax)', p: `Arnona is charged to the occupier of the property; at move-in the tenant registers with the municipality, and when the apartment is empty the owner is usually liable. Rates and reductions are set by each municipality ${V}.` },
        { h: 'Va’ad bayit (building committee)', p: `Regular building maintenance fees are often paid by the tenant and exceptional works by the owner — this must be written in the lease ${V}.` },
      ],
      sources: [],
    },
    {
      id: 'insurance', icon: 'shield', title: 'Insurance',
      items: [
        { h: 'Who insures what', p: 'Building insurance is the landlord’s cost under the Fair Rental Law; the tenant usually insures their contents. Third-party liability and water damage cover should be reviewed with a licensed insurance agent.' },
        { h: 'War and terror damage', p: `Damage from hostile acts is generally handled through the state compensation fund rather than private policies ${V}.` },
      ],
      sources: ['knessetFairRental2017'],
    },
    {
      id: 'privacy', icon: 'lock', title: 'Privacy: Amendment 13',
      items: [
        { h: 'In force since 14 August 2025', p: 'Amendment 13 to the Protection of Privacy Law broadened key definitions, introduced the appointment of privacy protection officers in certain cases and gave the Privacy Protection Authority administrative enforcement powers, including financial sanctions.' },
        { h: 'What it means for landlords and managers', p: `Tenant files (ID, payslips, guarantor documents) contain personal data: collect only what is needed, store it securely, limit access and keep it only as long as necessary. Easybayit’s data-processing commitments will be set out in the management agreement ${L}.` },
      ],
      sources: ['ppaAmendment13'],
    },
    {
      id: 'accessibility', icon: 'user', title: 'Accessibility regulations',
      items: [
        { h: 'Digital accessibility', p: 'Service providers in Israel must make their websites accessible under the 2013 Service Accessibility Regulations, which refer to Israeli Standard SI 5568 (based on WCAG, level AA), and publish an accessibility statement.' },
        { h: 'Our approach', p: `This site and the owner portal are designed to WCAG 2.x AA; see our accessibility statement. Physical accessibility duties for buildings are a separate matter ${V}.` },
      ],
      sources: ['accessibilityRegs2013', 'si5568'],
    },
  ],
  checklist: {
    eyebrow: 'Download',
    title: 'Compliance checklist for owners',
    lead: 'A practical list to go through before, during and after a lease. Print it or save it as PDF.',
    download: 'Download PDF',
    print: 'Print',
    groups: [
      { title: 'Before letting', items: ['Choose your tax track for the year and note the deadline', 'Foreign resident: request a withholding approval from the assessing officer', 'Apartment fit for habitation; safe room (mamad), boiler, electricity checked', 'Building insurance in place; check water-damage cover'] },
      { title: 'Signing the lease', items: ['Written lease with all required details, translated if needed', 'Guarantees within the legal cap (lower of 3 months’ rent or 1/3 of total rent)', 'Who pays arnona, va’ad bayit, utilities — in writing', 'Condition report with dated photos and meter readings'] },
      { title: 'During the tenancy', items: ['Repairs: urgent within 3 days, others within 30 days of the request', 'Keep invoices and receipts for every expense', 'Rent received and withholding documented monthly', 'Renewal and indexation dates in the calendar'] },
      { title: 'Tax and reporting', items: ['10% track: report and pay within 30 days after year end', 'Annual return if required — with your accountant', 'Home-country declaration and treaty credit (non-residents)', 'Annual tax pack sent to your accountant'] },
      { title: 'End of tenancy', items: ['Exit report with photos; compare with check-in', 'Return or use guarantees only as allowed by law', 'Transfer arnona and utilities back; final meter readings', 'No self-help: eviction only through the courts'] },
      { title: 'Data and privacy', items: ['Collect only the tenant data you need', 'Store documents securely; limit access', 'Delete data no longer needed', 'Check the manager’s data-processing terms'] },
    ],
    footer: 'General information, not legal or tax advice. Sources and dates on easybayit — Legal & Tax hub.',
  },
  taxPack: {
    eyebrow: 'Service',
    title: 'Annual tax pack for your accountant',
    lead: 'Every year we prepare the documents your accountant needs — in Israel and in your country of residence. We do not give tax advice: we make your accountant’s work faster and more accurate.',
    items: [
      'Rent received month by month, per apartment',
      'All expenses with original invoices (repairs, va’ad bayit, insurance, arnona when vacant)',
      'Management fees with VAT shown separately',
      'Withholding certificates and payments to the Tax Authority',
      'Amounts also in USD, EUR or GBP at the Bank of Israel rate, with the date',
      'Lease, guarantees and inventory documents',
    ],
    when: `Delivered by ${P} each year. Included in the Full plan; for other plans ${P}.`,
  },
  partners: {
    eyebrow: 'Partner network',
    title: 'Licensed professionals, when you need them.',
    lead: `We are building a network of independent licensed professionals. Names will be published only after written agreement ${P}. Any referral arrangement will be disclosed to you.`,
    cards: [
      { icon: 'shield', role: 'Real estate lawyer (Israel)', text: 'Leases, disputes, eviction, purchase and sale.' },
      { icon: 'chart', role: 'Certified accountant (Israel)', text: 'Rental tax tracks, annual returns, withholding approvals.' },
      { icon: 'globe', role: 'Cross-border tax adviser', text: 'US, UK, France, Italy: treaty credits and home-country reporting.' },
      { icon: 'key', role: 'Licensed appraiser (shamai)', text: 'Formal valuations for sale, inheritance or disputes.' },
      { icon: 'doc', role: 'Licensed insurance agent', text: 'Building, liability and water-damage cover.' },
    ],
    placeholder: P,
  },
  teaser: {
    title: 'Legal & tax, with official sources',
    text: 'Tax tracks, withholding, the Fair Rental Law, privacy — explained precisely, with links to gov.il and the law texts.',
    cta: 'Open the Legal & Tax hub',
  },
};
export default en;
export type LegalDict = typeof en;
