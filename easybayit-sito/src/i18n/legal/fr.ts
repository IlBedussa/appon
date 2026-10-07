// Hub « Juridique & fiscal » — français. Mêmes règles que en.ts (sources officielles, rien d'inventé, V = à vérifier).
import type { LegalDict } from './en';
const V = '[À VÉRIFIER]';
const P = '[À CONFIRMER]';
const L = '[À VALIDER par un avocat]';

const fr: LegalDict = {
  V, P, L,
  nav: 'Juridique & fiscal',
  meta: {
    title: 'Droit et fiscalité des propriétaires en Israël · Easybayit',
    description: 'Imposition des loyers, retenue pour non-résidents, TVA, loi sur la location équitable, bail, expulsion, vie privée — avec sources officielles.',
  },
  eyebrow: 'Hub juridique & fiscal',
  h1: 'Le cadre juridique et fiscal, expliqué avec précision.',
  lead: 'Ce que tout propriétaire d’un appartement loué en Israël doit savoir — résident ou non-résident. Chaque affirmation renvoie à la source officielle, avec la date de notre dernière vérification.',
  disclaimer: 'Information générale, pas un conseil juridique ou fiscal. Les règles évoluent et dépendent de votre situation : consultez un avocat ou un expert-comptable israélien agréé (et un conseiller fiscal dans votre pays de résidence) avant d’agir.',
  verifyNote: `Les points marqués ${V} sont en cours de vérification par des professionnels avant publication.`,
  tocTitle: 'Sommaire',
  sourcesTitle: 'Sources officielles',
  lastReview: 'Contenu vérifié pour la dernière fois le 2 octobre 2026',
  sections: [
    {
      id: 'rental-tax', icon: 'wallet', title: 'Imposition des loyers : les trois régimes',
      items: [
        { h: 'Régime d’exonération', p: 'Les loyers d’habitation perçus par une personne physique peuvent être totalement exonérés lorsque le total mensuel des loyers de tous les logements ne dépasse pas le plafond — 5 654 ₪ par mois pour 2026 selon l’Autorité fiscale israélienne. Au-delà, une exonération partielle s’applique jusqu’au double du plafond ; au-delà, aucune exonération. Le logement doit notamment servir d’habitation au locataire.' },
        { h: 'Régime de 10 % (article 122)', p: 'Un impôt forfaitaire de 10 % sur le loyer brut, sans déduction de charges ni d’amortissement. L’impôt est payé dans les 30 jours suivant la fin de l’année fiscale de perception.' },
        { h: 'Régime ordinaire (barème)', p: 'Le loyer s’ajoute à vos autres revenus imposables et est taxé selon le barème ; en contrepartie, intérêts, réparations, frais de gestion et amortissement peuvent être déduits.' },
        { h: 'Résidents et non-résidents', p: `Les non-résidents sont imposables en Israël sur les loyers de source israélienne. Les régimes ouverts à un non-résident, l’application des points de crédit et le crédit d’impôt dans le pays de résidence au titre d’une convention fiscale doivent être vérifiés au cas par cas ${V}.` },
      ],
      sources: ['itaBooklet2026', 'ita122', 'itaRights2024'],
    },
    {
      id: 'withholding', icon: 'doc', title: 'Retenue à la source et déclarations des propriétaires étrangers',
      items: [
        { h: 'Retenue à la source', p: `Le loyer versé à un non-résident peut faire l’objet d’une retenue à la source par le payeur, sauf autorisation de taux réduit ou d’exonération délivrée par l’inspecteur des impôts. La directive 2026 de l’Autorité fiscale fixe la procédure des autorisations de retenue, y compris pour les loyers. Taux applicables ${V}.` },
        { h: 'Déclarations', p: `Le régime de 10 % suppose une déclaration et un paiement à l’Autorité fiscale ; les autres régimes passent par la déclaration annuelle. L’obligation de déclaration annuelle pour un non-résident dépend du régime et des autres revenus ${V}.` },
        { h: 'Virements à l’étranger', p: `Les banques peuvent demander des documents fiscaux avant de transférer les loyers à l’étranger ${V}. Nous tenons ces documents prêts dans le portail.` },
      ],
      sources: ['itaWithholding2026', 'itaRights2024'],
    },
    {
      id: 'vat', icon: 'chart', title: 'TVA sur les frais de gestion',
      items: [
        { h: 'Taux', p: 'Le taux normal de TVA en Israël est de 18 % depuis le 1er janvier 2025. Les frais de gestion facturés par une entreprise israélienne y sont soumis : c’est pourquoi nos prix sont affichés TVA comprise.' },
        { h: 'Le loyer lui-même', p: `Le loyer d’habitation perçu par un particulier n’est en général pas soumis à la TVA ${V}. Des règles particulières peuvent s’appliquer aux services fournis à des non-résidents ${V}.` },
      ],
      sources: ['itaVat18'],
    },
    {
      id: 'purchase-sale', icon: 'key', title: 'Droits d’acquisition et plus-value (investisseurs)',
      items: [
        { h: 'Droits d’acquisition (mas rechisha)', p: 'Les taux dépendent de la valeur et du fait qu’il s’agisse ou non de votre unique logement ; les tranches sont mises à jour périodiquement. Utilisez le simulateur officiel de l’Autorité fiscale plutôt que des approximations.' },
        { h: 'Impôt sur la plus-value immobilière (mas shevach)', p: `À la vente, la plus-value est imposable sauf exonération. Les exonérations pour un logement unique ont des conditions différentes pour résidents et non-résidents ${V}. Le régime choisi pour les loyers peut influer sur le calcul à la vente (ex. amortissement) ${V}.` },
      ],
      sources: ['itaRealEstateSimulator'],
    },
    {
      id: 'fair-rental', icon: 'shield', title: 'La loi sur la location équitable (2017)',
      items: [
        { h: 'Champ d’application', p: `L’amendement de 2017 à la loi sur la location et le prêt s’applique à la plupart des baux d’habitation ; il exclut notamment les baux de 3 mois au plus sans option de prolongation et les loyers au-delà d’un seuil mensuel (20 000 ₪, indexé) ${V}.` },
        { h: 'Habitabilité', p: 'Le bailleur doit remettre un logement habitable et en bon état, conformément à la loi et à son annexe, ainsi qu’un bail écrit comportant les mentions obligatoires.' },
        { h: 'Réparations', p: 'Le bailleur doit réparer les défauts non causés par un usage déraisonnable du locataire dans un délai raisonnable et au plus tard 30 jours après la demande — ou 3 jours pour un défaut qui empêche de vivre raisonnablement dans le logement.' },
        { h: 'Garanties et dépôts', p: 'Les garanties impliquant une sortie d’argent du locataire sont plafonnées au plus bas de trois mois de loyer ou d’un tiers du loyer pour toute la durée du bail, et ne peuvent être utilisées qu’aux fins prévues par la loi.' },
        { h: 'Frais non refacturables', p: `Certains frais restent à la charge du bailleur, comme l’assurance de l’immeuble et la commission d’agence lorsque l’agent a été mandaté par le bailleur ${V}.` },
      ],
      sources: ['knessetFairRental2017', 'govFairRentalBroker'],
    },
    {
      id: 'lease', icon: 'doc', title: 'L’essentiel du bail',
      items: [
        { h: 'Par écrit, dans une langue que vous comprenez', p: 'Un bail écrit est obligatoire pour les baux couverts par la loi. Si vous ne lisez pas l’hébreu, demandez une traduction et conservez les deux versions.' },
        { h: 'Clauses à vérifier', p: `Durée et options ; indexation ; garanties (dans la limite légale) ; qui paie l’arnona, le va’ad bayit et les charges ; état des lieux avec photos ; accès pour travaux ; résiliation anticipée ; préavis ${V}.` },
      ],
      sources: ['knessetFairRental2017'],
    },
    {
      id: 'eviction', icon: 'alert', title: 'Expulsion : aperçu de la procédure',
      items: [
        { h: 'Uniquement par voie judiciaire', p: `L’expulsion d’un locataire passe par une procédure accélérée devant le tribunal de première instance (Magistrates’ Court) selon le règlement de procédure civile de 2018. Elle ne vise que la libération des lieux ; les demandes financières sont séparées. Se faire justice soi-même (changer les serrures, couper les fluides) est interdit ${V}.` },
        { h: 'Exécution', p: 'Si le locataire ne quitte pas les lieux après le jugement, celui-ci est exécuté par l’Autorité d’exécution et de recouvrement.' },
      ],
      sources: ['kolZchutEviction'],
      note: `Lien vers le texte officiel du règlement à ajouter après relecture ${V}.`,
    },
    {
      id: 'arnona-vaad', icon: 'pin', title: 'Arnona et va’ad bayit',
      items: [
        { h: 'Arnona (taxe municipale)', p: `L’arnona est due par l’occupant ; à l’entrée, le locataire s’inscrit auprès de la municipalité, et lorsque le logement est vide, le propriétaire en est généralement redevable. Taux et réductions sont fixés par chaque municipalité ${V}.` },
        { h: 'Va’ad bayit (copropriété)', p: `Les charges courantes sont souvent payées par le locataire et les travaux exceptionnels par le propriétaire — à écrire dans le bail ${V}.` },
      ],
      sources: [],
    },
    {
      id: 'insurance', icon: 'shield', title: 'Assurances',
      items: [
        { h: 'Qui assure quoi', p: 'L’assurance de l’immeuble est à la charge du bailleur selon la loi sur la location équitable ; le locataire assure en général ses biens. Responsabilité civile et dégâts des eaux sont à revoir avec un agent d’assurance agréé.' },
        { h: 'Dommages de guerre et de terrorisme', p: `Les dommages dus à des actes hostiles relèvent en général du fonds d’indemnisation de l’État plutôt que des polices privées ${V}.` },
      ],
      sources: ['knessetFairRental2017'],
    },
    {
      id: 'privacy', icon: 'lock', title: 'Vie privée : amendement 13',
      items: [
        { h: 'En vigueur depuis le 14 août 2025', p: 'L’amendement 13 à la loi sur la protection de la vie privée a élargi les définitions clés, introduit la désignation de délégués à la protection des données dans certains cas et doté l’Autorité de protection de la vie privée de pouvoirs de sanction administrative, y compris financière.' },
        { h: 'Pour les bailleurs et gestionnaires', p: `Les dossiers locataires (pièce d’identité, bulletins de salaire, documents du garant) contiennent des données personnelles : ne collecter que le nécessaire, stocker de façon sécurisée, limiter l’accès et ne conserver que le temps utile. Les engagements d’Easybayit figureront dans le mandat de gestion ${L}.` },
      ],
      sources: ['ppaAmendment13'],
    },
    {
      id: 'accessibility', icon: 'user', title: 'Réglementation sur l’accessibilité',
      items: [
        { h: 'Accessibilité numérique', p: 'Les prestataires de services en Israël doivent rendre leurs sites accessibles selon le règlement de 2013 sur l’accessibilité des services, qui renvoie à la norme israélienne SI 5568 (fondée sur les WCAG, niveau AA), et publier une déclaration d’accessibilité.' },
        { h: 'Notre approche', p: `Ce site et le portail propriétaires sont conçus selon les WCAG 2.x AA ; voir notre déclaration d’accessibilité. Les obligations d’accessibilité physique des immeubles sont une question distincte ${V}.` },
      ],
      sources: ['accessibilityRegs2013', 'si5568'],
    },
  ],
  checklist: {
    eyebrow: 'Télécharger',
    title: 'Check-list de conformité pour propriétaires',
    lead: 'Une liste pratique à parcourir avant, pendant et après un bail. Imprimez-la ou enregistrez-la en PDF.',
    download: 'Télécharger le PDF',
    print: 'Imprimer',
    groups: [
      { title: 'Avant de louer', items: ['Choisir son régime fiscal de l’année et noter l’échéance', 'Non-résident : demander une autorisation de retenue à l’inspecteur des impôts', 'Logement habitable ; mamad, chauffe-eau, électricité vérifiés', 'Assurance de l’immeuble en place ; vérifier la garantie dégâts des eaux'] },
      { title: 'Signature du bail', items: ['Bail écrit avec toutes les mentions obligatoires, traduit si besoin', 'Garanties dans la limite légale (plus bas de 3 mois de loyer ou 1/3 du loyer total)', 'Qui paie arnona, va’ad bayit, charges — par écrit', 'État des lieux avec photos datées et relevés de compteurs'] },
      { title: 'Pendant la location', items: ['Réparations : urgentes sous 3 jours, autres sous 30 jours après la demande', 'Conserver factures et reçus de chaque dépense', 'Loyers perçus et retenues documentés chaque mois', 'Dates de renouvellement et d’indexation dans l’agenda'] },
      { title: 'Fiscalité et déclarations', items: ['Régime 10 % : déclarer et payer dans les 30 jours après la fin de l’année', 'Déclaration annuelle si nécessaire — avec votre comptable', 'Déclaration dans le pays de résidence et crédit conventionnel (non-résidents)', 'Dossier fiscal annuel envoyé à votre comptable'] },
      { title: 'Fin de location', items: ['État des lieux de sortie avec photos ; comparer avec l’entrée', 'Restituer ou utiliser les garanties uniquement comme la loi le permet', 'Retransférer arnona et charges ; relevés finaux', 'Pas de justice privée : expulsion uniquement par le tribunal'] },
      { title: 'Données et vie privée', items: ['Ne collecter que les données nécessaires', 'Stocker les documents de façon sécurisée ; limiter l’accès', 'Supprimer les données devenues inutiles', 'Vérifier les conditions de traitement des données du gestionnaire'] },
    ],
    footer: 'Information générale, pas un conseil juridique ou fiscal. Sources et dates sur easybayit — Hub juridique & fiscal.',
  },
  taxPack: {
    eyebrow: 'Service',
    title: 'Dossier fiscal annuel pour votre comptable',
    lead: 'Chaque année, nous préparons les documents dont votre comptable a besoin — en Israël et dans votre pays de résidence. Nous ne donnons pas de conseil fiscal : nous rendons son travail plus rapide et plus précis.',
    items: [
      'Loyers perçus mois par mois, par logement',
      'Toutes les dépenses avec factures originales (réparations, va’ad bayit, assurance, arnona en cas de vacance)',
      'Frais de gestion avec TVA détaillée',
      'Attestations de retenue et paiements à l’Autorité fiscale',
      'Montants aussi en USD, EUR ou GBP au taux de la Banque d’Israël, avec la date',
      'Bail, garanties et inventaire',
    ],
    when: `Remis avant le ${P} chaque année. Inclus dans la formule Full ; pour les autres formules ${P}.`,
  },
  partners: {
    eyebrow: 'Réseau de partenaires',
    title: 'Des professionnels agréés, quand vous en avez besoin.',
    lead: `Nous constituons un réseau de professionnels agréés indépendants. Les noms ne seront publiés qu’après accord écrit ${P}. Tout accord de recommandation vous sera communiqué.`,
    cards: [
      { icon: 'shield', role: 'Avocat en droit immobilier (Israël)', text: 'Baux, litiges, expulsion, achat et vente.' },
      { icon: 'chart', role: 'Expert-comptable (Israël)', text: 'Régimes fiscaux des loyers, déclarations annuelles, autorisations de retenue.' },
      { icon: 'globe', role: 'Conseiller fiscal international', text: 'France, Belgique, Royaume-Uni, États-Unis : crédits conventionnels et déclarations.' },
      { icon: 'key', role: 'Expert immobilier agréé (shamai)', text: 'Évaluations formelles pour vente, succession ou litige.' },
      { icon: 'doc', role: 'Agent d’assurance agréé', text: 'Immeuble, responsabilité civile, dégâts des eaux.' },
    ],
    placeholder: P,
  },
  teaser: {
    title: 'Juridique & fiscal, avec sources officielles',
    text: 'Régimes fiscaux, retenue à la source, loi sur la location équitable, vie privée — expliqués avec précision, avec liens vers gov.il et les textes de loi.',
    cta: 'Ouvrir le hub juridique & fiscal',
  },
};
export default fr;
