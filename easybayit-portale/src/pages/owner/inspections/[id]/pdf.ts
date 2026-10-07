// PDF del report di ispezione (RLS: se l'ispezione non è visibile all'utente → 404). Download registrato nell'audit.
import type { APIRoute } from 'astro';
import { inspectionPdf } from '../../../../lib/inspection-routes';
export const GET: APIRoute = (ctx) => inspectionPdf(ctx);
