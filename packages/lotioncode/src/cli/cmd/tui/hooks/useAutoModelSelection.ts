import { createMemo, createSignal } from "solid-js"
import { useSync } from "@tui/context/sync"

export type TaskType = "code" | "chat" | "analysis" | "creative" | "fast"

export interface TaskProfile {
  type: TaskType
  complexity: "low" | "medium" | "high"
  contextLength: number
  requiresSpeed: boolean
}

export function useAutoModelSelection() {
  const sync = useSync()
  const [enabled, setEnabled] = createSignal(false)

  const providers = createMemo(() => sync.data.provider)

  function analyzePrompt(prompt: string): TaskProfile {
    const lower = prompt.toLowerCase()
    const length = prompt.length

    // Determine task type
    let type: TaskType = "chat"
    if (
      lower.includes("code") ||
      lower.includes("function") ||
      lower.includes("component") ||
      lower.includes("implement") ||
      lower.includes("refactor") ||
      lower.includes("bug") ||
      lower.includes("fix")
    ) {
      type = "code"
    } else if (
      lower.includes("explain") ||
      lower.includes("analyze") ||
      lower.includes("review") ||
      lower.includes("what is") ||
      lower.includes("how does")
    ) {
      type = "analysis"
    } else if (lower.includes("write") || lower.includes("create") || lower.includes("generate")) {
      type = "creative"
    } else if (lower.includes("quick") || lower.includes("fast") || length < 50) {
      type = "fast"
    }

    // Determine complexity
    let complexity: "low" | "medium" | "high" = "low"
    if (length > 500 || lower.includes("complex") || lower.includes("architecture")) {
      complexity = "high"
    } else if (length > 200 || lower.includes("multiple") || lower.includes("several")) {
      complexity = "medium"
    }

    return {
      type,
      complexity,
      contextLength: length,
      requiresSpeed: type === "fast" || lower.includes("quick") || lower.includes("fast"),
    }
  }

  function selectModel(profile: TaskProfile): { providerID: string; modelID: string } | null {
    const available = providers()
    if (available.length === 0) return null

    // Filter models based on task profile
    const candidates: Array<{
      providerID: string
      modelID: string
      score: number
      cost: number
      speed: number
      quality: number
    }> = []

    for (const provider of available) {
      for (const [modelID, model] of Object.entries(provider.models)) {
        // Skip models without cost info
        if (!model.cost?.input && !model.cost?.output) continue

        let score = 0
        let speed = 50
        let quality = 50

        // Score based on task type
        switch (profile.type) {
          case "code":
            // Prefer models good at code (Claude, GPT-4)
            if (modelID.includes("claude") || modelID.includes("gpt-4")) {
              score += 50
              quality += 30
            }
            if (modelID.includes("opus")) {
              score += 40
              quality += 40
            }
            break
          case "analysis":
            // Balanced models for analysis
            if (modelID.includes("claude") || modelID.includes("gpt-4")) {
              score += 40
              quality += 20
            }
            break
          case "creative":
            // Creative tasks - any capable model
            if (modelID.includes("claude") || modelID.includes("gpt-4") || modelID.includes("large")) {
              score += 30
              quality += 20
            }
            break
          case "fast":
          case "chat":
            // Fast/cheap models for simple tasks
            if (modelID.includes("haiku") || modelID.includes("mini") || modelID.includes("flash")) {
              score += 50
              speed += 40
            }
            break
        }

        // Adjust for complexity
        if (profile.complexity === "high") {
          if (model.limit?.context && model.limit.context > 100000) {
            score += 20 // Large context for complex tasks
          }
          if (modelID.includes("opus") || modelID.includes("gpt-4")) {
            score += 30 // High quality for complex tasks
            quality += 20
          }
        }

        // Adjust for speed requirement
        if (profile.requiresSpeed) {
          if (modelID.includes("haiku") || modelID.includes("mini") || modelID.includes("flash")) {
            score += 40
            speed += 30
          }
        }

        // Cost factor (lower is better for simple tasks)
        const cost = model.cost?.input || 0
        if (profile.type === "fast" || profile.complexity === "low") {
          if (cost < 0.00001)
            score += 30 // Very cheap
          else if (cost < 0.0001) score += 20 // Cheap
        }

        candidates.push({
          providerID: provider.id,
          modelID,
          score,
          cost,
          speed,
          quality,
        })
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score)

    // Return best candidate or first available
    return candidates[0] || null
  }

  return {
    enabled,
    setEnabled,
    analyzePrompt,
    selectModel,
  }
}
