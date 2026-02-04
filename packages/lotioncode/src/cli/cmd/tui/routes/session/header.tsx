import { type Accessor, createMemo, createSignal, Match, Show, Switch } from "solid-js"
import { useRouteData } from "@tui/context/route"
import { useSync } from "@tui/context/sync"
import { pipe, sumBy } from "remeda"
import { useTheme } from "@tui/context/theme"
import { SplitBorder } from "@tui/component/border"
import type { AssistantMessage, Session } from "@lotioncode-ai/sdk/v2"
import { useCommandDialog } from "@tui/component/dialog-command"
import { useKeybind } from "../../context/keybind"
import { useTerminalDimensions } from "@opentui/solid"
import { useToast } from "../../ui/toast"
import { $ } from "bun"
import { createStore } from "solid-js/store"
import { Card, ProgressBar, StatusIndicator, Breadcrumb } from "../../component/ui-primitives"

export function Header() {
  const route = useRouteData("session")
  const sync = useSync()
  const session = createMemo(() => sync.session.get(route.sessionID)!)
  const messages = createMemo(() => sync.data.message[route.sessionID] ?? [])
  const toast = useToast()

  const [gitLoading, setGitLoading] = createStore({
    pull: false,
    push: false,
    commit: false,
    pr: false,
  })

  const handleGitPull = async () => {
    setGitLoading("pull", true)
    const result = await $`git pull origin dev`.nothrow()
    if (result.exitCode === 0) {
      toast.show({ message: "Git pull completed", variant: "success" })
    } else {
      toast.show({ message: "Git pull failed", variant: "error" })
    }
    setGitLoading("pull", false)
  }

  const handleGitPush = async () => {
    setGitLoading("push", true)
    const result = await $`git push origin dev`.nothrow()
    if (result.exitCode === 0) {
      toast.show({ message: "Git push completed", variant: "success" })
    } else {
      toast.show({ message: "Git push failed", variant: "error" })
    }
    setGitLoading("push", false)
  }

  const handleGitCommit = async () => {
    setGitLoading("commit", true)
    await $`git add .`.nothrow()
    const result = await $`git commit -m "feat: update"`.nothrow()
    if (result.exitCode === 0) {
      toast.show({ message: "Git commit completed", variant: "success" })
    } else {
      toast.show({ message: "Git commit failed", variant: "error" })
    }
    setGitLoading("commit", false)
  }

  const handleCreatePR = async () => {
    setGitLoading("pr", true)
    await $`git push -u origin dev`.nothrow()
    const result = await $`gh pr create --title "feat: update" --body "Changes from session"`.nothrow()
    if (result.exitCode === 0) {
      toast.show({ message: "Pull request created", variant: "success" })
    } else {
      toast.show({ message: "Failed to create PR", variant: "error" })
    }
    setGitLoading("pr", false)
  }

  const cost = createMemo(() => {
    const total = pipe(
      messages(),
      sumBy((x) => (x.role === "assistant" ? x.cost : 0)),
    )
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

  const { theme } = useTheme()
  const keybind = useKeybind()
  const command = useCommandDialog()
  const [hover, setHover] = createSignal<"parent" | "prev" | "next" | null>(null)
  const dimensions = useTerminalDimensions()
  const narrow = createMemo(() => dimensions().width < 80)

  const breadcrumbItems = createMemo(() => {
    const items: Array<{ label: string; onClick?: () => void }> = [
      { label: "Home", onClick: () => command.trigger("home") },
    ]
    if (session()?.parentID) {
      items.push({ label: "Parent", onClick: () => command.trigger("session.parent") })
    }
    items.push({ label: session()?.title ?? "Session" })
    return items
  })

  return (
    <box flexShrink={0}>
      <box
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={1}
        {...SplitBorder}
        border={["left"]}
        borderColor={theme.border}
        flexShrink={0}
        backgroundColor={theme.backgroundPanel}
      >
        <Switch>
          <Match when={session()?.parentID}>
            <box flexDirection="column" gap={1}>
              <box flexDirection={narrow() ? "column" : "row"} justifyContent="space-between" gap={narrow() ? 1 : 0}>
                <box flexDirection="column" gap={1}>
                  <Breadcrumb items={breadcrumbItems()} />
                  <box flexDirection="row" gap={2}>
                    <Card
                      padding={1}
                      gap={0}
                      border={false}
                      hover={true}
                      onClick={() => command.trigger("session.parent")}
                    >
                      <text fg={theme.text}>↑ Parent</text>
                    </Card>
                    <Card
                      padding={1}
                      gap={0}
                      border={false}
                      hover={true}
                      onClick={() => command.trigger("session.child.previous")}
                    >
                      <text fg={theme.text}>← Prev</text>
                    </Card>
                    <Card
                      padding={1}
                      gap={0}
                      border={false}
                      hover={true}
                      onClick={() => command.trigger("session.child.next")}
                    >
                      <text fg={theme.text}>Next →</text>
                    </Card>
                  </box>
                </box>
                <Show when={contextInfo()}>
                  {(info) => (
                    <box flexDirection="column" alignItems="flex-end" gap={1}>
                      <ProgressBar
                        value={info().tokens}
                        max={info().limit ?? 100000}
                        width={15}
                        showPercentage={true}
                        variant={info().percentage > 90 ? "error" : info().percentage > 70 ? "warning" : "success"}
                      />
                      <text fg={theme.textMuted}>{cost()}</text>
                    </box>
                  )}
                </Show>
              </box>
            </box>
          </Match>
          <Match when={true}>
            <box flexDirection={narrow() ? "column" : "row"} justifyContent="space-between" gap={1}>
              <box flexDirection="column" gap={1}>
                <Breadcrumb items={breadcrumbItems()} />
                <box flexDirection="row" gap={1}>
                  <Card padding={1} gap={0} border={false} hover={true} onClick={handleGitPull}>
                    <text fg={theme.text}>{gitLoading.pull ? "⏳" : "⬇"} Pull</text>
                  </Card>
                  <Card padding={1} gap={0} border={false} hover={true} onClick={handleGitPush}>
                    <text fg={theme.text}>{gitLoading.push ? "⏳" : "⬆"} Push</text>
                  </Card>
                  <Card padding={1} gap={0} border={false} hover={true} onClick={handleGitCommit}>
                    <text fg={theme.text}>{gitLoading.commit ? "⏳" : "✓"} Commit</text>
                  </Card>
                  <Card padding={1} gap={0} border={false} hover={true} onClick={handleCreatePR}>
                    <text fg={theme.text}>{gitLoading.pr ? "⏳" : "↗"} PR</text>
                  </Card>
                </box>
              </box>
              <Show when={contextInfo()}>
                {(info) => (
                  <box flexDirection="column" alignItems="flex-end" gap={1}>
                    <ProgressBar
                      value={info().tokens}
                      max={info().limit ?? 100000}
                      width={15}
                      showPercentage={true}
                      variant={info().percentage > 90 ? "error" : info().percentage > 70 ? "warning" : "success"}
                    />
                    <text fg={theme.textMuted}>{cost()}</text>
                  </box>
                )}
              </Show>
            </box>
          </Match>
        </Switch>
      </box>
    </box>
  )
}
