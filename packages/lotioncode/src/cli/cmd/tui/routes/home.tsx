import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createMemo, For, Match, onMount, Show, Switch } from "solid-js"
import { useTheme } from "@tui/context/theme"
import { useKeybind } from "@tui/context/keybind"
import { Logo } from "../component/logo"
import { Tips } from "../component/tips"
import { Locale } from "@/util/locale"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useDirectory } from "../context/directory"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { Installation } from "@/installation"
import { useKV } from "../context/kv"
import { useCommandDialog } from "../component/dialog-command"
import { useDialog } from "../ui/dialog"
import { DialogTokenUsage } from "../component/dialog-token-usage"
import { DialogMetrics } from "../component/dialog-metrics"

// TODO: what is the best way to do this?
let once = false

export function Home() {
  const sync = useSync()
  const kv = useKV()
  const { theme } = useTheme()
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  const command = useCommandDialog()
  const dialog = useDialog()
  const mcp = createMemo(() => Object.keys(sync.data.mcp).length > 0)
  const mcpError = createMemo(() => {
    return Object.values(sync.data.mcp).some((x) => x.status === "failed")
  })

  const connectedMcpCount = createMemo(() => {
    return Object.values(sync.data.mcp).filter((x) => x.status === "connected").length
  })

  const isFirstTimeUser = createMemo(() => sync.data.session.length === 0)
  const tipsHidden = createMemo(() => kv.get("tips_hidden", false))
  const showTips = createMemo(() => {
    if (isFirstTimeUser()) return false
    return !tipsHidden()
  })

  // Recent sessions (last 5)
  const recentSessions = createMemo(() => {
    return [...sync.data.session]
      .filter((s) => !s.parentID)
      .sort((a, b) => b.time.updated - a.time.updated)
      .slice(0, 5)
  })

  // Total usage stats
  const usageStats = createMemo(() => {
    let totalCost = 0
    let totalTokens = 0
    let totalRequests = 0

    for (const messages of Object.values(sync.data.message)) {
      for (const msg of messages) {
        if (msg.role !== "assistant") continue
        totalCost += msg.cost
        totalTokens +=
          msg.tokens.input + msg.tokens.output + msg.tokens.reasoning + msg.tokens.cache.read + msg.tokens.cache.write
        totalRequests++
      }
    }

    return { totalCost, totalTokens, totalRequests }
  })

  command.register(() => [
    {
      title: tipsHidden() ? "Show tips" : "Hide tips",
      value: "tips.toggle",
      keybind: "tips_toggle",
      category: "System",
      onSelect: (dialog) => {
        kv.set("tips_hidden", !tipsHidden())
        dialog.clear()
      },
    },
    {
      title: "Token Usage",
      value: "token.usage",
      category: "Dashboard",
      onSelect: () => {
        dialog.replace(() => <DialogTokenUsage />)
      },
    },
    {
      title: "Performance Metrics",
      value: "performance.metrics",
      category: "Dashboard",
      onSelect: () => {
        dialog.replace(() => <DialogMetrics />)
      },
    },
  ])

  const Hint = (
    <Show when={connectedMcpCount() > 0}>
      <box flexShrink={0} flexDirection="row" gap={1}>
        <text fg={theme.text}>
          <Switch>
            <Match when={mcpError()}>
              <span style={{ fg: theme.error }}>•</span> mcp errors{" "}
              <span style={{ fg: theme.textMuted }}>ctrl+x s</span>
            </Match>
            <Match when={true}>
              <span style={{ fg: theme.success }}>•</span>{" "}
              {Locale.pluralize(connectedMcpCount(), "{} mcp server", "{} mcp servers")}
            </Match>
          </Switch>
        </text>
      </box>
    </Show>
  )

  let prompt: PromptRef
  const args = useArgs()
  onMount(() => {
    if (once) return
    if (route.initialPrompt) {
      prompt.set(route.initialPrompt)
      once = true
    } else if (args.prompt) {
      prompt.set({ input: args.prompt, parts: [] })
      once = true
      prompt.submit()
    }
  })
  const directory = useDirectory()

  const keybind = useKeybind()

  return (
    <>
      <box flexGrow={1} paddingLeft={2} paddingRight={2} gap={1}>
        {/* Header with Logo */}
        <box height={2} />
        <box justifyContent="center" alignItems="center">
          <Logo />
        </box>

        {/* Quick Stats */}
        <Show when={!isFirstTimeUser()}>
          <box flexDirection="row" justifyContent="center" gap={4} paddingTop={1} paddingBottom={1}>
            <box flexDirection="row" gap={1}>
              <text fg={theme.textMuted}>Sessions:</text>
              <text fg={theme.text}>{sync.data.session.length}</text>
            </box>
            <box flexDirection="row" gap={1}>
              <text fg={theme.textMuted}>Tokens:</text>
              <text fg={theme.text}>{usageStats().totalTokens.toLocaleString()}</text>
            </box>
            <box flexDirection="row" gap={1}>
              <text fg={theme.textMuted}>Cost:</text>
              <text fg={theme.text}>${usageStats().totalCost.toFixed(4)}</text>
            </box>
          </box>
        </Show>

        {/* Prompt Input */}
        <box width="100%" maxWidth={75} zIndex={1000} paddingTop={1}>
          <Prompt
            ref={(r) => {
              prompt = r
              promptRef.set(r)
            }}
            hint={Hint}
          />
        </box>

        {/* Quick Actions */}
        <box flexDirection="row" justifyContent="center" gap={2} paddingTop={1} paddingBottom={1}>
          <box
            backgroundColor={theme.backgroundElement}
            paddingLeft={1}
            paddingRight={1}
            onMouseUp={() => command.trigger("token.usage")}
          >
            <text fg={theme.text}>📊 Token Usage</text>
          </box>
          <box
            backgroundColor={theme.backgroundElement}
            paddingLeft={1}
            paddingRight={1}
            onMouseUp={() => command.trigger("performance.metrics")}
          >
            <text fg={theme.text}>⚡ Metrics</text>
          </box>
          <box
            backgroundColor={theme.backgroundElement}
            paddingLeft={1}
            paddingRight={1}
            onMouseUp={() => command.trigger("session.list")}
          >
            <text fg={theme.text}>📁 Sessions</text>
          </box>
        </box>

        {/* Recent Sessions */}
        <Show when={recentSessions().length > 0}>
          <box paddingTop={2} width="100%" maxWidth={75}>
            <box flexDirection="row" justifyContent="space-between" paddingBottom={1}>
              <text fg={theme.text}>
                <b>Recent Sessions</b>
              </text>
              <text fg={theme.textMuted} onMouseUp={() => command.trigger("session.list")}>
                View all →
              </text>
            </box>
            <box flexDirection="column" gap={1}>
              <For each={recentSessions()}>
                {(session) => (
                  <box
                    flexDirection="row"
                    justifyContent="space-between"
                    backgroundColor={theme.backgroundElement}
                    paddingLeft={1}
                    paddingRight={1}
                    paddingTop={1}
                    paddingBottom={1}
                    onMouseUp={() => {
                      // Navigate to session
                      command.trigger(`session.open.${session.id}`)
                    }}
                  >
                    <box flexDirection="column" flexGrow={1}>
                      <text fg={theme.text} wrapMode="word">
                        {session.title}
                      </text>
                      <text fg={theme.textMuted}>{Locale.todayTimeOrDateTime(session.time.updated)}</text>
                    </box>
                    <box flexShrink={0}>
                      <text fg={theme.textMuted}>→</text>
                    </box>
                  </box>
                )}
              </For>
            </box>
          </box>
        </Show>

        {/* Tips */}
        <box height={3} width="100%" maxWidth={75} alignItems="center" paddingTop={2}>
          <Show when={showTips()}>
            <Tips />
          </Show>
        </box>

        <Toast />
      </box>

      {/* Footer */}
      <box paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexDirection="row" flexShrink={0} gap={2}>
        <text fg={theme.textMuted}>{directory()}</text>
        <box gap={1} flexDirection="row" flexShrink={0}>
          <Show when={mcp()}>
            <text fg={theme.text}>
              <Switch>
                <Match when={mcpError()}>
                  <span style={{ fg: theme.error }}>⊙ </span>
                </Match>
                <Match when={true}>
                  <span style={{ fg: connectedMcpCount() > 0 ? theme.success : theme.textMuted }}>⊙ </span>
                </Match>
              </Switch>
              {connectedMcpCount()} MCP
            </text>
            <text fg={theme.textMuted}>/status</text>
          </Show>
        </box>
        <box flexGrow={1} />
        <box flexShrink={0}>
          <text fg={theme.textMuted}>v{Installation.VERSION}</text>
        </box>
      </box>
    </>
  )
}
