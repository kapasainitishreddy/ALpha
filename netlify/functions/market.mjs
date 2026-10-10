import { marketResponse } from '../../server/market-api.mjs'
export default async (request) => {
  if (request.method !== 'GET') return new Response(null, { status: 405 })
  const { status, body } = await marketResponse(request.url)
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
export const config = { path: ['/api/quote', '/api/history'] }
