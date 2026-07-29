import { useState } from 'react'
import { Banner, Field, Section } from '@/components/common'
import { useStore } from '@/store/useStore'
import { askCoachLLM, LLM_CALLS_PER_MINUTE, PROVIDER_PRESETS } from '@/engines/llmCoach'
import { Sparkles } from 'lucide-react'

export default function AiSettings() {
  const { llm, setLlm } = useStore()
  const [test, setTest] = useState('')
  const [busy, setBusy] = useState(false)

  const pickProvider = (id: string) => {
    const p = PROVIDER_PRESETS.find((x) => x.id === id)!
    setLlm({ provider: p.id, baseUrl: p.baseUrl || llm.baseUrl, model: p.model || llm.model })
  }
  const preset = PROVIDER_PRESETS.find((p) => p.id === llm.provider)

  const runTest = async () => {
    setBusy(true)
    setTest('')
    const r = await askCoachLLM('What is a stop loss? Reply in Telugu-English.', llm, false)
    setTest(`[${r.engine === 'llm' ? 'AI model' : 'built-in coach'}] ${r.text}`)
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <Banner>
        <Sparkles size={14} className="inline mr-1" />
        The coach works without any key. Add one AI API key here to upgrade it. Safety guardrails still apply to every AI answer, and it falls back to the built-in coach if the provider fails.
      </Banner>

      <Section title="AI coach">
        <div className="flex gap-2">
          <button className={`btn flex-1 ${!llm.enabled ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLlm({ enabled: false })}>
            Built-in only
          </button>
          <button className={`btn flex-1 ${llm.enabled ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLlm({ enabled: true })}>
            Use AI API key
          </button>
        </div>
      </Section>

      {llm.enabled && (
        <>
          <Section title="Provider">
            <select className="input" value={llm.provider} onChange={(e) => pickProvider(e.target.value)}>
              {PROVIDER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {preset?.note && <div className="text-xs text-muted mt-1">{preset.note}</div>}
          </Section>

          <Section title="Connection">
            <div className="space-y-3">
              <Field label="Base URL">
                <input className="input" value={llm.baseUrl} onChange={(e) => setLlm({ baseUrl: e.target.value })} placeholder="https://.../v1" />
              </Field>
              <Field label="Model name">
                <input className="input" value={llm.model} onChange={(e) => setLlm({ model: e.target.value })} />
              </Field>
              <Field label={`API key (${preset?.keyHint || 'optional'})`}>
                <input className="input" type="password" value={llm.apiKey} onChange={(e) => setLlm({ apiKey: e.target.value })} placeholder="paste key" />
              </Field>
            </div>
            <Banner tone="warn">
              Keys are stored only in this browser. Never enter a key on a shared device. Rate limit: max {LLM_CALLS_PER_MINUTE} AI answers per minute (protects your key quota). Some providers block browser calls (CORS); Groq, NVIDIA and Ollama are the reliable choices.
            </Banner>
          </Section>

          <Section title="Test">
            <button className="btn-primary w-full" disabled={busy} onClick={runTest}>
              {busy ? 'testing...' : 'Test: ask "What is a stop loss?"'}
            </button>
            {test && <div className="card !p-3 text-sm mt-2 whitespace-pre-wrap">{test}</div>}
          </Section>
        </>
      )}

      <Section title="Your fine-tuned model">
        <div className="card text-sm space-y-1">
          <div>1. Export the dataset (Fine-Tuning Dataset Builder screen).</div>
          <div>2. Train on a free Colab GPU with docs/finetune/train_lora.py.</div>
          <div>3. Serve it with Ollama, then pick the Ollama preset above.</div>
          <div className="text-muted">Training needs a GPU, so it runs on Colab, not inside this app.</div>
        </div>
      </Section>
    </div>
  )
}
