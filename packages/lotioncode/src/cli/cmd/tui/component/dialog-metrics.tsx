import { useSync } from "@tui/context/sync"
import { createMemo, For } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import type { AssistantMessage } from "@lotioncode-ai/sdk/v2"

export function DialogMetrics() {
  const sync = useSync()
  const { theme } = useTheme()
  const dialog = useDialog()

  const metrics = createMemo(() => {
    const byProvider = new Map<
      string,
      {
        providerID: string
        modelID: string
        responseTimes: number[]
        totalTokens: number
        totalCost: number
        requests: number
        errors: number
      }
    >()

    for (const sessionID of Object.keys(sync.data.message)) {
      const messages = sync.data.message[sessionID] || []
      for (const msg of messages) {
        if (msg.role !== "assistant") continue
        const assistant = msg as AssistantMessage
        const key = `${assistant.providerID}:${assistant.modelID}`

        // Calculate response time from message timing
        const responseTime = assistant.time?.completed ? assistant.time.completed - assistant.time.created : 0

        const existing = byProvider.get(key)
        if (existing) {
          if (responseTime > 0) existing.responseTimes.push(responseTime)
          existing.totalTokens +=
            assistant.tokens.input +
            assistant.tokens.output +
            assistant.tokens.reasoning +
            assistant.tokens.cache.read +
            assistant.tokens.cache.write
          existing.totalCost += assistant.cost
          existing.requests += 1
        } else {
          byProvider.set(key, {
            providerID: assistant.providerID,
            modelID: assistant.modelID,
            responseTimes: responseTime > 0 ? [responseTime] : [],
            totalTokens:
              assistant.tokens.input +
              assistant.tokens.output +
              assistant.tokens.reasoning +
              assistant.tokens.cache.read +
              assistant.tokens.cache.write,
            totalCost: assistant.cost,
            requests: 1,
            errors: 0,
          })
        }
      }
    }

    return Array.from(byProvider.values()).map((m) => ({
      ...m,
      avgResponseTime:
        m.responseTimes.length > 0 ? m.responseTimes.reduce((a, b) => a + b, 0) / m.responseTimes.length : 0,
      tokensPerSecond:
        m.responseTimes.length > 0 ? m.totalTokens / (m.responseTimes.reduce((a, b) => a + b, 0) / 1000) : 0,
    }))
  })

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const options = createMemo(() =>
    metrics()
      .sort((a, b) => b.totalCost - a.totalCost)
      .map((m) => ({
        title: `${m.providerID} / ${m.modelID}`,
        description: `Avg: ${formatDuration(m.avgResponseTime)} · ${m.tokensPerSecond.toFixed(0)} tokens/s`,
        value: m.providerID,
        footer: `${m.requests} requests · $${m.totalCost.toFixed(4)}`,
      })),
  )

  return <DialogSelect title="Performance Metrics" options={options()} onSelect={() => dialog.clear()} />
}
