import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'coverage', '.netlify'])
const TEXT_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.md', '.toml', '.yml', '.yaml', '.env'])

const PATTERNS = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['OpenAI-style key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ['Groq key', /\bgsk_[A-Za-z0-9]{20,}\b/g],
  ['Stripe live secret', /\bsk_live_[A-Za-z0-9]{20,}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/g],
]

function ext(name) {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot) : ''
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) walk(path, out)
    else if (st.size <= 2 * 1024 * 1024 && (TEXT_EXTS.has(ext(name)) || name === '.env')) out.push(path)
  }
  return out
}

const findings = []
for (const file of walk(ROOT)) {
  const text = readFileSync(file, 'utf8')
  for (const [label, pattern] of PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(text)) findings.push(`${label}: ${relative(ROOT, file)}`)
  }
}

if (findings.length) {
  console.error('Potential committed secrets found:\n' + findings.join('\n'))
  process.exit(1)
}
console.log('High-confidence committed-secret scan PASS')
