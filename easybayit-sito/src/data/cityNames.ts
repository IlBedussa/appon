// Nomi delle città con dato CBS (src/data/market.ts) nelle 4 lingue, per il selettore dello strumento di stima.
// cbs = codice località (verificati su data.gov.il il 02/10/2026) (סמל ישוב) usato per l'autocompletamento delle vie da data.gov.il.
import type { Locale } from '../i18n/config';
type N = Record<Locale, string>;
export const cityNames: Record<string, N & { cbs?: number }> = {
  jerusalem: { en: 'Jerusalem', he: 'ירושלים', fr: 'Jérusalem', it: 'Gerusalemme', cbs: 3000 },
  'tel-aviv': { en: 'Tel Aviv-Yafo', he: 'תל אביב-יפו', fr: 'Tel Aviv-Jaffa', it: 'Tel Aviv-Giaffa', cbs: 5000 },
  netanya: { en: 'Netanya', he: 'נתניה', fr: 'Netanya', it: 'Netanya', cbs: 7400 },
  'beit-shemesh': { en: 'Beit Shemesh', he: 'בית שמש', fr: 'Beit Shemesh', it: 'Beit Shemesh', cbs: 2610 },
  raanana: { en: 'Ra’anana', he: 'רעננה', fr: 'Ra’anana', it: 'Ra’anana', cbs: 8700 },
  herzliya: { en: 'Herzliya', he: 'הרצליה', fr: 'Herzliya', it: 'Herzliya', cbs: 6400 },
  'kfar-saba': { en: 'Kfar Saba', he: 'כפר סבא', fr: 'Kfar Saba', it: 'Kfar Saba', cbs: 6900 },
  'ramat-gan': { en: 'Ramat Gan', he: 'רמת גן', fr: 'Ramat Gan', it: 'Ramat Gan', cbs: 8600 },
  'rishon-lezion': { en: 'Rishon LeZion', he: 'ראשון לציון', fr: 'Rishon LeZion', it: 'Rishon LeZion', cbs: 8300 },
  'petah-tikva': { en: 'Petah Tikva', he: 'פתח תקווה', fr: 'Petah Tikva', it: 'Petah Tikva', cbs: 7900 },
  holon: { en: 'Holon', he: 'חולון', fr: 'Holon', it: 'Holon', cbs: 6600 },
  rehovot: { en: 'Rehovot', he: 'רחובות', fr: 'Rehovot', it: 'Rehovot', cbs: 8400 },
  ashdod: { en: 'Ashdod', he: 'אשדוד', fr: 'Ashdod', it: 'Ashdod', cbs: 70 },
  'bnei-brak': { en: 'Bnei Brak', he: 'בני ברק', fr: 'Bnei Brak', it: 'Bnei Brak', cbs: 6100 },
  'bat-yam': { en: 'Bat Yam', he: 'בת ים', fr: 'Bat Yam', it: 'Bat Yam', cbs: 6200 },
  hadera: { en: 'Hadera', he: 'חדרה', fr: 'Hadera', it: 'Hadera', cbs: 6500 },
  ashkelon: { en: 'Ashkelon', he: 'אשקלון', fr: 'Ashkelon', it: 'Ashkelon', cbs: 7100 },
  haifa: { en: 'Haifa', he: 'חיפה', fr: 'Haïfa', it: 'Haifa', cbs: 4000 },
  beersheba: { en: 'Beersheba', he: 'באר שבע', fr: 'Beer-Sheva', it: 'Beersheba', cbs: 9000 },
};
export const districtNames: Record<string, N> = {
  jerusalem: { en: 'Jerusalem district', he: 'מחוז ירושלים', fr: 'district de Jérusalem', it: 'distretto di Gerusalemme' },
  center: { en: 'Central district', he: 'מחוז המרכז', fr: 'district Centre', it: 'distretto Centro' },
  'tel-aviv': { en: 'Tel Aviv district', he: 'מחוז תל אביב', fr: 'district de Tel Aviv', it: 'distretto di Tel Aviv' },
  north: { en: 'Northern district', he: 'מחוז הצפון', fr: 'district Nord', it: 'distretto Nord' },
  south: { en: 'Southern district', he: 'מחוז הדרום', fr: 'district Sud', it: 'distretto Sud' },
  haifa: { en: 'Haifa district', he: 'מחוז חיפה', fr: 'district de Haïfa', it: 'distretto di Haifa' },
};
export const otherCity: N = { en: 'Other city (national average)', he: 'עיר אחרת (ממוצע ארצי)', fr: 'Autre ville (moyenne nationale)', it: 'Altra città (media nazionale)' };
export const israelName: N = { en: 'Israel', he: 'ישראל', fr: 'Israël', it: 'Israele' };
