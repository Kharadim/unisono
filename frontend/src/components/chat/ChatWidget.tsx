import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MessageCircle, X, Send, Loader2, AlertTriangle, Bot, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ChatMessage, ChatResponse } from '@/types'

function getContextHint(pathname: string): string {
  const empMatch = pathname.match(/^\/employees\/(\d+)/)
  if (empMatch) return `employee:${empMatch[1]}`
  const projMatch = pathname.match(/^\/projects\/(\d+)/)
  if (projMatch) return `project:${projMatch[1]}`
  const jfMatch = pathname.match(/^\/jourfix\/(\d+)/)
  if (jfMatch) return `employee:${jfMatch[1]}`
  return 'dashboard'
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hallo! Ich bin dein KI-Assistent. Frag mich zu deinem Team, Projekten oder allgemeinen Fuehrungsthemen.',
}

const CLOUD_CONSENT_KEY = 'teamlead_ki_cloud_consent'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConsent, setShowConsent] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const location = useLocation()

  const { data: kiSettings } = useQuery({
    queryKey: ['ki-settings'],
    queryFn: api.getKISettings,
  })

  const isCloudProvider = kiSettings?.provider && kiSettings.provider !== 'ollama'
  const hasCloudConsent = () => localStorage.getItem(CLOUD_CONSENT_KEY) === 'true'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    // Cloud consent check — show dialog on first use
    if (isCloudProvider && !hasCloudConsent()) {
      setPendingMessage(text)
      setShowConsent(true)
      return
    }

    await _doSend(text)
  }

  const handleConsentAccept = () => {
    localStorage.setItem(CLOUD_CONSENT_KEY, 'true')
    setShowConsent(false)
    if (pendingMessage) {
      _doSend(pendingMessage)
      setPendingMessage(null)
    }
  }

  const handleConsentDecline = () => {
    setShowConsent(false)
    setPendingMessage(null)
  }

  const _doSend = async (text: string) => {
    const userMessage: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // Build history (exclude welcome message)
      const history = messages
        .filter((_, i) => i > 0) // skip welcome
        .map(m => ({ role: m.role, content: m.content }))

      const data: ChatResponse = await api.sendChatMessage({
        message: text,
        context_hint: getContextHint(location.pathname),
        history,
      })

      if (data.error) {
        const errorMessages: Record<string, string> = {
          not_configured: 'KI nicht eingerichtet. Oeffne die KI-Einstellungen in der Sidebar.',
          connection_failed: data.message || 'Keine Verbindung zum KI-Server.',
          auth_failed: data.message || 'API-Key ungueltig.',
          model_not_found: data.message || 'Modell nicht gefunden.',
          timeout: 'Die Antwort hat zu lange gedauert. Bitte versuche es erneut.',
        }
        setError(errorMessages[data.error] || data.message || 'Unbekannter Fehler.')
      } else if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response! }])
      }
    } catch (e) {
      setError('Verbindung zum Server fehlgeschlagen.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Simple markdown rendering (bold, lists)
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Inline code
      processed = processed.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')

      // Unordered list
      if (/^\s*[-*]\s/.test(line)) {
        const text = line.replace(/^\s*[-*]\s/, '')
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processedText }} />
      }
      // Numbered list
      if (/^\s*\d+\.\s/.test(line)) {
        const text = line.replace(/^\s*\d+\.\s/, '')
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        processedText = processedText.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: processedText }} />
      }
      // Empty line = spacer
      if (!line.trim()) return <div key={i} className="h-2" />
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />
    })
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center print:hidden"
          title="KI-Assistent oeffnen"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] max-h-[80vh] max-w-[calc(100vw-2rem)] bg-background rounded-xl shadow-2xl border flex flex-col chat-panel-enter print:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary rounded-t-xl">
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5" />
              <span className="font-medium text-sm">KI-Assistent</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="space-y-1 leading-relaxed">{renderContent(msg.content)}</div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Denke nach...
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex justify-start">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Cloud Consent Dialog */}
          {showConsent && (
            <div className="border-t p-4 bg-amber-50 space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 space-y-1.5">
                  <p className="font-semibold">Mitarbeiterdaten werden an {kiSettings?.provider === 'gemini' ? 'Google' : kiSettings?.provider === 'openai' ? 'OpenAI' : 'Anthropic'} gesendet</p>
                  <p>Der KI-Assistent sendet automatisch Kontext mit deiner Frage:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                    <li>Name, Rolle, Abteilung des Mitarbeiters</li>
                    <li>Notizen und Gespraechsprotokolle</li>
                    <li>Vereinbarungen, Ziele, Stimmungswerte</li>
                    <li>Entwicklungsplan und Leistungsbewertung</li>
                  </ul>
                  <p>Stelle sicher, dass dein Unternehmen diesen Cloud-Anbieter freigegeben hat.</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleConsentDecline}>Abbrechen</Button>
                <Button size="sm" onClick={handleConsentAccept}>Verstanden, fortfahren</Button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Frage stellen..."
                rows={1}
                className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[36px] max-h-[100px]"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 100) + 'px'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-md bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
