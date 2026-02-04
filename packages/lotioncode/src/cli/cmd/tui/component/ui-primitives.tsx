import { useTheme } from "@tui/context/theme"
import { Show, type JSX } from "solid-js"

interface CardProps {
  children: JSX.Element
  padding?: number
  gap?: number
  border?: boolean
  background?: boolean
  hover?: boolean
  onClick?: () => void
  flexDirection?: "row" | "column"
  flexGrow?: number
  flexShrink?: number
  alignItems?: "center" | "flex-start" | "flex-end"
  justifyContent?: "center" | "flex-start" | "flex-end" | "space-between"
}

export function Card(props: CardProps) {
  const { theme } = useTheme()

  const padding = props.padding ?? 1
  const gap = props.gap ?? 1
  const border = props.border !== false
  const background = props.background !== false

  return (
    <box
      flexDirection={props.flexDirection ?? "column"}
      flexGrow={props.flexGrow}
      flexShrink={props.flexShrink}
      alignItems={props.alignItems as any}
      justifyContent={props.justifyContent as any}
      paddingLeft={padding}
      paddingRight={padding}
      paddingTop={padding}
      paddingBottom={padding}
      gap={gap}
      backgroundColor={background ? theme.backgroundPanel : undefined}
      borderColor={border ? theme.border : undefined}
      borderStyle={border ? "single" : undefined}
      onMouseUp={props.onClick}
    >
      {props.children}
    </box>
  )
}

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState(props: EmptyStateProps) {
  const { theme } = useTheme()

  return (
    <Card padding={2} gap={1} flexDirection="column" alignItems="center" justifyContent="center">
      <Show when={props.icon}>
        <text fg={theme.textMuted}>{props.icon}</text>
      </Show>
      <text fg={theme.text}>
        <b>{props.title}</b>
      </text>
      <Show when={props.description}>
        <text fg={theme.textMuted}>{props.description}</text>
      </Show>
      <Show when={props.action}>
        <box
          paddingLeft={1}
          paddingRight={1}
          backgroundColor={theme.backgroundElement}
          onMouseUp={props.action!.onClick}
        >
          <text fg={theme.primary}>{props.action!.label}</text>
        </box>
      </Show>
    </Card>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  width?: number
  showPercentage?: boolean
  variant?: "default" | "success" | "warning" | "error"
}

export function ProgressBar(props: ProgressBarProps) {
  const { theme } = useTheme()

  const width = props.width ?? 20
  const percentage = Math.min(100, Math.max(0, (props.value / props.max) * 100))
  const filled = Math.round((percentage / 100) * width)

  const variantColors = {
    default: theme.primary,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
  }

  const color = variantColors[props.variant ?? "default"]

  return (
    <box flexDirection="row" gap={1}>
      <text fg={theme.border}>
        {"["}
        <span style={{ fg: color }}>{"█".repeat(filled)}</span>
        <span style={{ fg: theme.backgroundElement }}>{"░".repeat(width - filled)}</span>
        {"]"}
      </text>
      <Show when={props.showPercentage}>
        <text fg={theme.textMuted}>{Math.round(percentage)}%</text>
      </Show>
    </box>
  )
}

interface StatusIndicatorProps {
  status: "success" | "error" | "warning" | "info" | "pending"
  label?: string
  showIcon?: boolean
}

export function StatusIndicator(props: StatusIndicatorProps) {
  const { theme } = useTheme()

  const icons = {
    success: "✓",
    error: "✗",
    warning: "▲",
    info: "ℹ",
    pending: "⋯",
  }

  const colors = {
    success: theme.success,
    error: theme.error,
    warning: theme.warning,
    info: theme.info,
    pending: theme.textMuted,
  }

  const icon = props.showIcon !== false ? icons[props.status] : undefined
  const color = colors[props.status]

  return (
    <box flexDirection="row" gap={1}>
      <Show when={icon}>
        <text fg={color}>{icon}</text>
      </Show>
      <Show when={props.label}>
        <text fg={color}>{props.label}</text>
      </Show>
    </box>
  )
}

interface SkeletonProps {
  lines?: number
  width?: number
}

export function Skeleton(props: SkeletonProps) {
  const { theme } = useTheme()
  const lines = props.lines ?? 3
  const width = props.width ?? 40

  return (
    <box flexDirection="column" gap={1}>
      {Array.from({ length: lines }).map((_, i) => (
        <text fg={theme.backgroundElement}>{"█".repeat(width - (i % 2) * 10)}</text>
      ))}
    </box>
  )
}

interface BreadcrumbProps {
  items: Array<{ label: string; onClick?: () => void }>
}

export function Breadcrumb(props: BreadcrumbProps) {
  const { theme } = useTheme()

  return (
    <box flexDirection="row" gap={1}>
      {props.items.map((item, index) => (
        <>
          <Show when={index > 0}>
            <text fg={theme.textMuted}>›</text>
          </Show>
          <text fg={item.onClick ? theme.text : theme.textMuted} onMouseUp={item.onClick}>
            {item.label}
          </text>
        </>
      ))}
    </box>
  )
}

interface KeybindHintProps {
  keybind: string
  action: string
}

export function KeybindHint(props: KeybindHintProps) {
  const { theme } = useTheme()

  return (
    <box flexDirection="row" gap={1}>
      <text fg={theme.textMuted}>{props.action}</text>
      <text fg={theme.primary}>{props.keybind}</text>
    </box>
  )
}
