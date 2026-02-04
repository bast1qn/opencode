import { useSync } from "@tui/context/sync"
import { createMemo, For, Show, Switch, Match } from "solid-js"
import { createStore } from "solid-js/store"
import { useTheme } from "../../context/theme"
import { Locale } from "@/util/locale"
import type { AssistantMessage } from "@lotioncode-ai/sdk/v2"
import { Global } from "@/global"
import { Installation } from "@/installation"
import { useDirectory } from "../../context/directory"
import { useKV } from "../../context/kv"
import { TodoItem } from "../../component/todo-item"
import { Card, ProgressBar, StatusIndicator } from "../../component/ui-primitives"

export function Sidebar(props: { sessionID: string; overlay?: boolean }) {
  const sync = useSync()
  const { theme } = useTheme()
  const session = createMemo(() => sync.session.get(props.sessionID)!)
  const diff = createMemo(() => sync.data.session_diff[props.sessionID] ?? [])
  const todo = createMemo(() => sync.data.todo[props.sessionID] ?? [])
  const messages = createMemo(() => sync.data.message[props.sessionID] ?? [])

  const [expanded, setExpanded] = createStore({
    mcp: false,
    diff: true,
    todo: true,
    lsp: false,
  })

  const mcpEntries = createMemo(() => Object.entries(sync.data.mcp).sort(([a], [b]) => a.localeCompare(b)))
  const connectedMcpCount = createMemo(() => mcpEntries().filter(([_, item]) => item.status === "connected").length)
  const errorMcpCount = createMemo(
    () =>
      mcpEntries().filter(
        ([_, item]) =>
          item.status === "failed" || item.status === "needs_auth" || item.status === "needs_client_registration",
      ).length,
  )

  const cost = createMemo(() => {
    const total = messages().reduce((sum, x) => sum + (x.role === "assistant" ? x.cost : 0), 0)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total)
  })

  const contextInfo = createMemo(() => {
    const last = messages().findLast((x) => x.role === "assistant" && x.tokens.output > 0) as AssistantMessage
    if (!last) return null
    const total =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = sync.data.provider.find((x) => x.id === last.providerID)?.models[last.modelID]
    const limit = model?.limit.context
    const percentage = limit ? Math.round((total / limit) * 100) : 0

    return {
      tokens: total,
      percentage,
      limit,
    }
  })

  const directory = useDirectory()
  const kv = useKV()

  const hasProviders = createMemo(() =>
    sync.data.provider.some((x) => x.id !== "lotioncode" || Object.values(x.models).some((y) => y.cost?.input !== 0)),
  )
  const gettingStartedDismissed = createMemo(() => kv.get("dismissed_getting_started", false))

  return (
    <Show when={session()}>
      <box
        backgroundColor={theme.backgroundPanel}
        width={42}
        height="100%"
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
        position={props.overlay ? "absolute" : "relative"}
      >
        <scrollbox flexGrow={1}>
          <box flexShrink={0} gap={1} paddingRight={1}>
            <box paddingRight={1}>
              <text fg={theme.text}>
                <b>{session().title}</b>
              </text>
              <Show when={session().share?.url}>
                <text fg={theme.textMuted}>{session().share!.url}</text>
              </Show>
            </box>

            <Show when={contextInfo()}>
              {(info) => (
                <Card padding={1} gap={1}>
                  <box flexDirection="row" justifyContent="space-between">
                    <text fg={theme.text}>
                      <b>Context</b>
                    </text>
                    <text fg={theme.textMuted}>{cost()}</text>
                  </box>
                  <ProgressBar
                    value={info().tokens}
                    max={info().limit ?? 100000}
                    width={35}
                    showPercentage={true}
                    variant={info().percentage > 90 ? "error" : info().percentage > 70 ? "warning" : "success"}
                  />
                  <text fg={theme.textMuted}>{info().tokens.toLocaleString()} tokens</text>
                </Card>
              )}
            </Show>

            <Show when={mcpEntries().length > 0}>
              <Card padding={1} gap={1}>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => mcpEntries().length > 2 && setExpanded("mcp", !expanded.mcp)}
                >
                  <Show when={mcpEntries().length > 2}>
                    <text fg={theme.text}>{expanded.mcp ? "▼" : "▶"}</text>
                  </Show>
                  <box flexDirection="row" gap={1} flexGrow={1}>
                    <text fg={theme.text}>
                      <b>MCP</b>
                    </text>
                    <Show when={!expanded.mcp}>
                      <box flexDirection="row" gap={1}>
                        <StatusIndicator status="success" label={connectedMcpCount().toString()} />
                        <Show when={errorMcpCount() > 0}>
                          <StatusIndicator status="error" label={errorMcpCount().toString()} />
                        </Show>
                      </box>
                    </Show>
                  </box>
                </box>
                <Show when={mcpEntries().length <= 2 || expanded.mcp}>
                  <For each={mcpEntries()}>
                    {([key, item]) => {
                      const statusMap: Record<string, "success" | "error" | "warning" | "info" | "pending"> = {
                        connected: "success",
                        failed: "error",
                        disabled: "info",
                        needs_auth: "warning",
                        needs_client_registration: "error",
                      }
                      return (
                        <box flexDirection="row" gap={1}>
                          <StatusIndicator status={statusMap[item.status] ?? "info"} />
                          <text fg={theme.text} wrapMode="word">
                            {key}{" "}
                            <span style={{ fg: theme.textMuted }}>
                              <Switch fallback={item.status}>
                                <Match when={item.status === "connected"}>Connected</Match>
                                <Match when={item.status === "failed" && item}>{(val) => <i>{val().error}</i>}</Match>
                                <Match when={item.status === "disabled"}>Disabled</Match>
                                <Match when={(item.status as string) === "needs_auth"}>Needs auth</Match>
                                <Match when={(item.status as string) === "needs_client_registration"}>
                                  Needs client ID
                                </Match>
                              </Switch>
                            </span>
                          </text>
                        </box>
                      )
                    }}
                  </For>
                </Show>
              </Card>
            </Show>

            <Show when={sync.data.lsp.length > 0}>
              <Card padding={1} gap={1}>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => sync.data.lsp.length > 2 && setExpanded("lsp", !expanded.lsp)}
                >
                  <Show when={sync.data.lsp.length > 2}>
                    <text fg={theme.text}>{expanded.lsp ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>LSP</b>
                  </text>
                </box>
                <Show when={sync.data.lsp.length <= 2 || expanded.lsp}>
                  <For each={sync.data.lsp}>
                    {(item) => (
                      <box flexDirection="row" gap={1}>
                        <StatusIndicator status={item.status === "connected" ? "success" : "error"} />
                        <text fg={theme.textMuted}>{item.id}</text>
                      </box>
                    )}
                  </For>
                </Show>
              </Card>
            </Show>

            <Show when={todo().length > 0 && todo().some((t) => t.status !== "completed")}>
              <Card padding={1} gap={1}>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => todo().length > 2 && setExpanded("todo", !expanded.todo)}
                >
                  <Show when={todo().length > 2}>
                    <text fg={theme.text}>{expanded.todo ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>Todo</b>
                  </text>
                </box>
                <Show when={todo().length <= 2 || expanded.todo}>
                  <For each={todo()}>{(todo) => <TodoItem status={todo.status} content={todo.content} />}</For>
                </Show>
              </Card>
            </Show>

            <Show when={diff().length > 0}>
              <Card padding={1} gap={1}>
                <box
                  flexDirection="row"
                  gap={1}
                  onMouseDown={() => diff().length > 2 && setExpanded("diff", !expanded.diff)}
                >
                  <Show when={diff().length > 2}>
                    <text fg={theme.text}>{expanded.diff ? "▼" : "▶"}</text>
                  </Show>
                  <text fg={theme.text}>
                    <b>Modified Files</b>
                  </text>
                </box>
                <Show when={diff().length <= 2 || expanded.diff}>
                  <For each={diff() || []}>
                    {(item) => (
                      <box flexDirection="row" gap={1} justifyContent="space-between">
                        <text fg={theme.textMuted} wrapMode="none">
                          {item.file}
                        </text>
                        <box flexDirection="row" gap={1} flexShrink={0}>
                          <Show when={item.additions}>
                            <text fg={theme.diffAdded}>+{item.additions}</text>
                          </Show>
                          <Show when={item.deletions}>
                            <text fg={theme.diffRemoved}>-{item.deletions}</text>
                          </Show>
                        </box>
                      </box>
                    )}
                  </For>
                </Show>
              </Card>
            </Show>
          </box>
        </scrollbox>

        <box flexShrink={0} gap={1} paddingTop={1}>
          <Show when={!hasProviders() && !gettingStartedDismissed()}>
            <Card padding={1} gap={1} background={true}>
              <box flexDirection="row" justifyContent="space-between">
                <text fg={theme.text}>
                  <b>Getting started</b>
                </text>
                <text fg={theme.textMuted} onMouseDown={() => kv.set("dismissed_getting_started", true)}>
                  ✕
                </text>
              </box>
              <text fg={theme.textMuted}>LotionCode includes free models so you can start immediately.</text>
              <text fg={theme.textMuted}>Connect from 75+ providers to use other models.</text>
            </Card>
          </Show>
          <text>
            <span style={{ fg: theme.textMuted }}>{directory().split("/").slice(0, -1).join("/")}/</span>
            <span style={{ fg: theme.text }}>{directory().split("/").at(-1)}</span>
          </text>
          <text fg={theme.textMuted}>
            <span style={{ fg: theme.success }}>•</span> <b>Open</b>
            <span style={{ fg: theme.text }}>
              <b>Code</b>
            </span>{" "}
            <span>{Installation.VERSION}</span>
          </text>
        </box>
      </box>
    </Show>
  )
}
