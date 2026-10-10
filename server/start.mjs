import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { marketMiddleware } from './market-api.mjs'
const root = resolve('dist')
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
}
createServer((req, res) =>
  marketMiddleware(req, res, async () => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
      if (!file.startsWith(root + '/')) {
        res.writeHead(403)
        return res.end()
      }
      const body = await readFile(file)
      res.writeHead(200, {
        'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('Not found')
    }
  }),
).listen(Number(process.env.PORT ?? 4173), '0.0.0.0')
