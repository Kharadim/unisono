import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CheckCircle, XCircle, Loader2, Shield, Globe, ChevronDown, ExternalLink, HelpCircle, Copy, Check } from 'lucide-react'
import type { KISettings as KISettingsType } from '@/types'

interface KISettingsProps {
  open: boolean
  onClose: () => void
}

const PROVIDER_OPTIONS = [
  { value: 'ollama', label: 'Ollama (lokal)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
]

const MODEL_DEFAULTS: Record<string, string> = {
  ollama: 'qwen2.5:7b',
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-5-20250514',
}

const SETUP_GUIDES: Record<string, { steps: { text: string; link?: string; command?: string }[] }> = {
  ollama: {
    steps: [
      { text: 'Ollama herunterladen und installieren', link: 'https://ollama.com/download' },
      { text: 'Ollama starten (erscheint als Icon in der Taskleiste)' },
      { text: 'Terminal oeffnen und Modell laden:', command: 'ollama pull qwen2.5:7b' },
      { text: 'Oben auf "Verbindung testen" klicken' },
    ],
  },
  gemini: {
    steps: [
      { text: 'Google AI Studio oeffnen', link: 'https://aistudio.google.com/apikey' },
      { text: 'API-Key erstellen (kostenlos)' },
      { text: 'Key oben einfuegen und "Verbindung testen"' },
    ],
  },
  openai: {
    steps: [
      { text: 'OpenAI Platform oeffnen', link: 'https://platform.openai.com/api-keys' },
      { text: 'Neuen API-Key erstellen (Konto + Guthaben noetig)' },
      { text: 'Key oben einfuegen und "Verbindung testen"' },
    ],
  },
  anthropic: {
    steps: [
      { text: 'Anthropic Console oeffnen', link: 'https://console.anthropic.com/settings/keys' },
      { text: 'Neuen API-Key erstellen (Konto + Guthaben noetig)' },
      { text: 'Key oben einfuegen und "Verbindung testen"' },
    ],
  },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="ml-1 text-muted-foreground hover:text-foreground transition-colors" title="Kopieren">
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

function ModelHelpBubble({ provider, model }: { provider: string; model: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Hilfe"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-10 w-64 p-3 rounded-lg bg-popover border shadow-lg text-xs space-y-2">
          {provider === 'ollama' ? (
            <>
              <p className="text-foreground font-medium">Modell muss zuerst geladen werden</p>
              <p className="text-muted-foreground">Terminal oeffnen und eingeben:</p>
              <div className="flex items-center gap-1 bg-muted rounded px-2 py-1 border font-mono text-[11px]">
                <code className="flex-1 select-all">ollama pull {model || 'qwen2.5:7b'}</code>
                <CopyButton text={`ollama pull ${model || 'qwen2.5:7b'}`} />
              </div>
              <div className="border-t pt-2 mt-2">
                <p className="text-muted-foreground mb-1">Empfohlene Modelle:</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li><span className="text-foreground font-medium">qwen2.5:7b</span> — schnell, 4.7 GB</li>
                  <li><span className="text-foreground font-medium">gemma3</span> — staerker, 8 GB</li>
                  <li><span className="text-foreground font-medium">phi4</span> — ausfuehrlicher, 9 GB</li>
                </ul>
              </div>
              <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer"
                 className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5">
                Alle Modelle <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </>
          ) : (
            <p className="text-muted-foreground">
              Standard: <span className="font-medium text-foreground">{MODEL_DEFAULTS[provider]}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function KISettings({ open, onClose }: KISettingsProps) {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(true)
  const [provider, setProvider] = useState('ollama')
  const [endpoint, setEndpoint] = useState('http://localhost:11434')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('qwen2.5:7b')
  const [showEndpoint, setShowEndpoint] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const { data: settings } = useQuery<KISettingsType>({
    queryKey: ['ki-settings'],
    queryFn: api.getKISettings,
    enabled: open,
  })

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled !== false)
      setProvider(settings.provider || 'ollama')
      setEndpoint(settings.endpoint || 'http://localhost:11434')
      setModel(settings.model || 'qwen2.5:7b')
      setApiKey('')
      setShowEndpoint(false)
      setShowSetup(false)
      setTestResult(null)
    }
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () => api.updateKISettings({ provider, endpoint, api_key: apiKey, model, enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ki-settings'] })
      setTestResult(null)
    },
  })

  const testMutation = useMutation({
    mutationFn: () => api.testKIConnection(),
    onSuccess: (data) => {
      setTestResult(data)
      if (!data.ok) setShowSetup(true)
    },
  })

  const handleTest = () => {
    saveMutation.mutate(undefined, {
      onSuccess: () => testMutation.mutate(),
    })
  }

  const isExternal = provider !== 'ollama'
  const guide = SETUP_GUIDES[provider]

  return (
    <Dialog open={open} onClose={onClose} className="p-0 overflow-hidden flex flex-col border border-border">
      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-6 pb-3 min-h-0">
        <DialogHeader>
          <DialogTitle>KI-Assistent</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Enabled Toggle */}
          <label className="flex items-center justify-between px-3 py-2.5 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors">
            <div>
              <span className="text-sm font-medium">KI-Features aktivieren</span>
              <p className="text-xs text-muted-foreground">Chat-Widget, JF-Vorbereitung und KI-Analysen</p>
            </div>
            <div className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
            </div>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only" />
          </label>

          {/* Provider — only shown when enabled */}
          {!enabled && (
            <p className="text-xs text-muted-foreground text-center py-2">
              KI-Features sind deaktiviert. Chat-Widget und JF-Vorbereitung werden ausgeblendet.
            </p>
          )}

          {enabled && <>
          <div>
            <label className="text-sm font-medium mb-1 block">Provider</label>
          <Select
            value={provider}
            onChange={e => {
              const val = e.target.value
              setProvider(val)
              setModel(MODEL_DEFAULTS[val] || '')
              setTestResult(null)
              setShowSetup(false)
              if (val === 'ollama') setEndpoint('http://localhost:11434')
            }}
            options={PROVIDER_OPTIONS}
          />
        </div>

        {/* API Key (external providers) */}
        {isExternal && (
          <div>
            <label className="text-sm font-medium mb-1 block">API-Key</label>
            <Input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={settings?.api_key_set ? 'Gespeichert (leer = beibehalten)' : 'API-Key eingeben'}
            />
          </div>
        )}

        {/* Model with help bubble */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="text-sm font-medium">Modell</label>
            <ModelHelpBubble provider={provider} model={model} />
          </div>
          <Input
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder={MODEL_DEFAULTS[provider]}
          />
        </div>

        {/* Ollama: Advanced endpoint */}
        {provider === 'ollama' && (
          <div>
            <button
              onClick={() => setShowEndpoint(!showEndpoint)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${showEndpoint ? 'rotate-180' : ''}`} />
              Erweitert
            </button>
            {showEndpoint && (
              <div className="mt-1.5">
                <label className="text-xs text-muted-foreground mb-1 block">Endpoint-URL</label>
                <Input
                  value={endpoint}
                  onChange={e => setEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Privacy hint */}
        {isExternal ? (
          <div className="px-3 py-2.5 rounded-md text-xs bg-amber-50 text-amber-700 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              Mitarbeiterdaten werden an externen Dienst gesendet
            </div>
            <p>Bei jeder Chat-Anfrage und JF-Vorbereitung werden automatisch Mitarbeiterdaten (Name, Notizen, Vereinbarungen, Ziele, Stimmung, Entwicklungsplan) an den gewaehlten Provider uebermittelt.</p>
            <p className="font-medium">Pruefe vor der Nutzung:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Ist der Provider im Unternehmen freigegeben?</li>
              <li>Existiert ein Data Processing Agreement (DPA)?</li>
              <li>Hat der Betriebsrat/DSB die Nutzung genehmigt?</li>
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="h-3.5 w-3.5 flex-shrink-0" /> Alle Daten bleiben lokal auf deinem Rechner
          </div>
        )}

        {/* Test + Result */}
        <div className="space-y-2">
          {testResult && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs border ${
              testResult.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {testResult.ok ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> : <XCircle className="h-3.5 w-3.5 flex-shrink-0" />}
              <span className="truncate">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Setup guide — auto-shown on test failure, or manual toggle */}
        {guide && (
          <div>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${showSetup ? 'rotate-180' : ''}`} />
              Einrichtungsanleitung
            </button>
            {showSetup && (
              <div className="mt-2 p-3 rounded-md bg-muted/50 border border-border">
                <ol className="space-y-2">
                  {guide.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="flex-shrink-0 h-4 w-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        {step.link ? (
                          <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 inline-flex items-center gap-0.5">
                            {step.text} <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-foreground">{step.text}</span>
                        )}
                        {step.command && (
                          <div className="mt-1 flex items-center gap-1 bg-background rounded px-2 py-1 border font-mono text-[11px]">
                            <code className="flex-1 select-all">{step.command}</code>
                            <CopyButton text={step.command} />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        </>}
        </div>
      </div>

      {/* Fixed footer — always visible */}
      <div className="flex-shrink-0 border-t border-border px-6 py-3 bg-background">
        <div className="flex justify-between">
          {enabled ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testMutation.isPending || saveMutation.isPending}
            >
              {testMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Teste...</>
              ) : (
                'Verbindung testen'
              )}
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Speichere...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
