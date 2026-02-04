import { useSync } from "@tui/context/sync"
import { createMemo, For, Show } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { useDialog } from "@tui/ui/dialog"
import { DialogSelect } from "@tui/ui/dialog-select"
import type { AssistantMessage } from "@lotioncode-ai/sdk/v2"

export function DialogTokenUsage() {
  const sync = useSync()
  const { theme } = useTheme()
  const dialog = useDialog()

  const usage = createMemo(() => {
    const byProvider = new Map<
      string,
      {
        providerID: string
        modelID: string
        input: number
        output: number
        reasoning: number
        cacheRead: number
        cacheWrite: number
        cost: number
        requests: number
      }
    >()

    for (const sessionID of Object.keys(sync.data.message)) {
      const messages = sync.data.message[sessionID] || []
      for (const msg of messages) {
        if (msg.role !== "assistant") continue
        const assistant = msg as AssistantMessage
        const key = `${assistant.providerID}:${assistant.modelID}`

        const existing = byProvider.get(key)
        if (existing) {
          existing.input += assistant.tokens.input
          existing.output += assistant.tokens.output
          existing.reasoning += assistant.tokens.reasoning
          existing.cacheRead += assistant.tokens.cache.read
          existing.cacheWrite += assistant.tokens.cache.write
          existing.cost += assistant.cost
          existing.requests += 1
        } else {
          byProvider.set(key, {
            providerID: assistant.providerID,
            modelID: assistant.modelID,
            input: assistant.tokens.input,
            output: assistant.tokens.output,
            reasoning: assistant.tokens.reasoning,
            cacheRead: assistant.tokens.cache.read,
            cacheWrite: assistant.tokens.cache.write,
            cost: assistant.cost,
            requests: 1,
          })
        }
      }
    }

    return Array.from(byProvider.values()).sort((a, b) => b.cost - a.cost)
  })

  const totalCost = createMemo(() => usage().reduce((sum, u) => sum + u.cost, 0))
  const totalTokens = createMemo(() =>
    usage().reduce((sum, u) => sum + u.input + u.output + u.reasoning + u.cacheRead + u.cacheWrite, 0),
  )
  const totalRequests = createMemo(() => usage().reduce((sum, u) => sum + u.requests, 0))

  const options = createMemo(() => {
    const items = usage().map((u) => {
      const provider = sync.data.provider.find((p) => p.id === u.providerID)
      const model = provider?.models[u.modelID]
      const limit = model?.limit?.context
      const total = u.input + u.output + u.reasoning + u.cacheRead + u.cacheWrite
      const percentage = limit ? Math.round((total / limit) * 100) : null

      return {
        title: `${u.providerID} / ${u.modelID}`,
        description: `${total.toLocaleString()} tokens · $${u.cost.toFixed(4)} · ${u.requests} requests`,
        value: u.providerID,
        footer: percentage !== null ? `${percentage}% of limit` : undefined,
      }
    })

    // Add summary as first item
    items.unshift({
      title: "Total Usage",
      description: `${totalTokens().toLocaleString()} tokens · $${totalCost().toFixed(4)} · ${totalRequests()} requests`,
      value: "__total__",
      footer: "All providers",
    })

    return items
  })

  return <DialogSelect title="Token Usage" options={options()} onSelect={() => dialog.clear()} />
}
