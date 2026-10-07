// Modello CSV per l'import dei pagamenti.
import type { APIRoute } from 'astro';
export const GET: APIRoute = () =>
  new Response('paid_on,property_code,amount_ils,kind,method,status,reference,period\n2026-10-01,TLV-01,6500,rent,bank_transfer,paid,TRX-0001,2026-10\n', {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="payments-template.csv"' },
  });
