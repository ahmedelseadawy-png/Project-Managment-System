// supabase/functions/_shared/cors.ts
export const CORS_HEADERS = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods':'POST, OPTIONS' }
export const corsResponse  = () => new Response(null, { status: 204, headers: CORS_HEADERS })
export const jsonResponse  = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
export const errorResponse = (message: string, status = 400, errors: string[] = []) => jsonResponse({ error: message, errors }, status)
