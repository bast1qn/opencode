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
  const mcpError = createMemo(() => Object.values(sync.data.mcp).some((x) => x.status === "failed"))

  const connectedMcpCount = createMemo(
    () => Object.values(sync.data.mcp).filter((x) => x.status === "connected").length,
  )

  const isFirstTimeUser = createMemo(() => sync.data.session.length === 0)
  const tipsHidden = createMemo(() => kv.get("tips_hidden", false))
  const showTips = createMemo(() => !isFirstTimeUser() && !tipsHidden())

  const recentSessions = createMemo(() =>
    [...sync.data.session]
      .filter((s) => !s.parentID)
      .sort((a, b) => b.time.updated - a.time.updated)
      .slice(0, 3),
  )

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
      onSelect: () => dialog.replace(() => <DialogTokenUsage />),
    },
    {
      title: "Performance Metrics",
      value: "performance.metrics",
      category: "Dashboard",
      onSelect: () => dialog.replace(() => <DialogMetrics />),
    },
  ])

  const Hint = (
    <Show when={connectedMcpCount() > 0}>
      <box flexDirection="row" gap={1}>
        <text fg={theme.text}>
          <Switch>
            <Match when={mcpError()}>
              <span style={{ fg: theme.error }}>•</span> mcp errors
            </Match>
            <Match when={true}>
              <span style={{ fg: theme.success }}>•</span> {connectedMcpCount()} mcp
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

  return (
    <>
      <box flexGrow={1} justifyContent="center" alignItems="center" paddingLeft={2} paddingRight={2} gap={1}>
        <Logo />

        <box width="100%" maxWidth={75} paddingTop={1}>
          <Prompt
            ref={(r) => {
              prompt = r
              promptRef.set(r)
            }}
            hint={Hint}
          />
        </box>

        <Show when={!isFirstTimeUser()}>
          <box flexDirection="row" gap={3} paddingTop={1}>
            <text fg={theme.textMuted}>{sync.data.session.length} sessions</text>
            <text fg={theme.textMuted}>{usageStats().totalTokens.toLocaleString()} tokens</text>
            <text fg={theme.textMuted}>${usageStats().totalCost.toFixed(2)}</text>
          </box>
        </Show>

        <Show when={recentSessions().length > 0}>
          <box width="100%" maxWidth={75} paddingTop={2}>
            <box flexDirection="row" justifyContent="space-between" paddingBottom={1}>
              <text fg={theme.text}>Recent</text>
              <text fg={theme.textMuted} onMouseUp={() => command.trigger("session.list")}>
                View all
              </text>
            </box>
            <box flexDirection="column" gap={1}>
              <For each={recentSessions()}>
                {(session) => (
                  <box
                    flexDirection="row"
                    justifyContent="space-between"
                    paddingLeft={1}
                    paddingRight={1}
                    onMouseUp={() => command.trigger(`session.open.${session.id}`)}
                  >
                    <text fg={theme.text} wrapMode="word">
                      {session.title}
                    </text>
                    <text fg={theme.textMuted}>{Locale.todayTimeOrDateTime(session.time.updated)}</text>
                  </box>
                )}
              </For>
            </box>
          </box>
        </Show>

        <box height={2} />

        <Show when={showTips()}>
          <Tips />
        </Show>

        <Toast />
      </box>

      <box padding={1} paddingLeft={2} paddingRight={2} flexDirection="row" flexShrink={0} gap={2}>
        <text fg={theme.textMuted}>{directory()}</text>
        <box flexGrow={1} />
        <text fg={theme.textMuted}>v{Installation.VERSION}</text>
      </box>
    </>
  )
}
