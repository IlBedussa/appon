// Stampa il codice TOTP corrente per un segreto (solo utenti di prova locali).
import { totp } from './lib/totp.mjs';
const s = process.argv[2];
if (!s) { console.error('uso: node scripts/totp.mjs <segreto-base32>'); process.exit(1); }
console.log(totp(s));
