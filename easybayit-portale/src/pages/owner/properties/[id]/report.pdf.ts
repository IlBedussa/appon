// Report mensile sullo stato dell'immobile (?month=YYYY-MM, predefinito: mese scorso). Solo proprietario e staff.
import type { APIRoute } from 'astro';
import { healthReportPdf } from '../../../../lib/inspection-routes';
export const GET: APIRoute = (ctx) => healthReportPdf(ctx);
