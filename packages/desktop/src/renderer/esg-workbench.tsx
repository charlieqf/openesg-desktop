import { useServer, useTabs } from "@opencode-ai/app"
import { useLocation } from "@solidjs/router"
import { createEffect, on, onCleanup, onMount, Show, type ParentProps } from "solid-js"
import { createStore } from "solid-js/store"
import { contextIdentity, contextPrompt, esgOrigin, parseESGContext, type ESGContext } from "../esg-contract"
import { readESGLayout, saveESGLayout, type ESGLayout } from "./esg-layout"
import { fitFloatingRect, type FloatingRect } from "./esg-floating"
import "./esg-workbench.css"

// Chinese-only review copy for this opt-in spike; not production localization.
const [state, setState] = createStore({
  pane: "esg" as "esg" | "session" | "split",
  directory: "",
  pending: undefined as ESGContext | undefined,
  associated: undefined as ESGContext | undefined,
  status: "工作台已在 OpenCode 内打开。",
  ready: false,
})

export const esgWorkbenchActive = () => state.pane === "esg"
export const openNativeWorkspace = () => setState("pane", "session")

/** One workspace entry inside the upstream titlebar, not a second application shell. */
export function ESGEntry() {
  return <button class="esg-workspace-entry" aria-pressed={esgWorkbenchActive()} onClick={() => setState("pane", "esg")}>
    <span aria-hidden="true">◈</span> ESG 工作台
  </button>
}

export function ESGWorkbench(props: ParentProps<{ directory: string }>) {
  let frame: HTMLIFrameElement | undefined
  let workspace: HTMLDivElement | undefined
  const [preferences, setPreferences] = createStore({ layout: "side-by-side" as ESGLayout, notice: "", environment: false })
  const [floating, setFloating] = createStore({
    rect: { x: 10000, y: 72, width: 500, height: 580 },
    gesture: undefined as { kind: "move" | "resize"; pointer: number; x: number; y: number; rect: FloatingRect } | undefined,
  })
  const isFloating = () => preferences.layout === "floating" && state.pane === "split"
  const fit = (rect: FloatingRect) => fitFloatingRect(rect, { width: workspace?.clientWidth ?? 1, height: workspace?.clientHeight ?? 1 })
  const start = (event: PointerEvent & { currentTarget: HTMLButtonElement }, kind: "move" | "resize") => {
    if (event.button !== 0 || !isFloating()) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    setFloating("gesture", { kind, pointer: event.pointerId, x: event.clientX, y: event.clientY, rect: { ...floating.rect } })
  }
  const move = (event: PointerEvent) => {
    const gesture = floating.gesture
    if (!gesture || event.pointerId !== gesture.pointer) return
    const x = event.clientX - gesture.x
    const y = event.clientY - gesture.y
    setFloating("rect", fit(gesture.kind === "move"
      ? { ...gesture.rect, x: gesture.rect.x + x, y: gesture.rect.y + y }
      : { ...gesture.rect, width: gesture.rect.width + x, height: gesture.rect.height + y }))
  }
  const stop = () => setFloating("gesture", undefined)
  const nudge = (event: KeyboardEvent, kind: "move" | "resize") => {
    if (!isFloating() || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return
    event.preventDefault()
    event.stopPropagation()
    const step = event.shiftKey ? 40 : 10
    const x = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0
    const y = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0
    setFloating("rect", fit(kind === "move"
      ? { ...floating.rect, x: floating.rect.x + x, y: floating.rect.y + y }
      : { ...floating.rect, width: floating.rect.width + x, height: floating.rect.height + y }))
  }
  const chooseLayout = (layout: ESGLayout) => {
    stop()
    setPreferences({ layout, notice: saveESGLayout(() => window.localStorage, layout) ? "" : "布局已切换；偏好无法保存，仅本次有效。" })
  }
  onMount(() => {
    setPreferences("layout", readESGLayout(() => window.localStorage))
    setFloating("rect", fit(floating.rect))
    const observer = new ResizeObserver(() => setFloating("rect", fit(floating.rect)))
    if (workspace) observer.observe(workspace)
    onCleanup(() => observer.disconnect())
    setState("directory", props.directory)
    const receive = (event: MessageEvent) => {
      if (event.origin !== esgOrigin || event.source !== frame?.contentWindow) return
      const context = parseESGContext(event.data)
      if (!context) return
      setState({ pending: context, pane: "split", status: "正在建立原生会话草稿，不会调用模型。" })
    }
    window.addEventListener("message", receive)
    onCleanup(() => window.removeEventListener("message", receive))
  })
  const back = () => {
    setState("pane", "esg")
    frame?.contentWindow?.postMessage({ kind: "openesg.return", version: 1 }, esgOrigin)
  }
  return (
    <div ref={workspace} class="esg-workspace" data-view={state.pane} data-layout={preferences.layout} data-environment={preferences.environment} data-floating-interaction={!!floating.gesture}>
      <section class="esg-html-pane" hidden={state.pane === "session"} aria-label="ESG 工作台">
        <header class="esg-workspace-toolbar">
          <span><b>工作台</b><span class="esg-workspace-divider">/</span>ESG 报告</span>
          <small class="esg-prototype-notice">体验验证 · 虚构资料 · 未启用模型调用</small>
          <div class="esg-layout-switch" role="group" aria-label="工作台与会话布局">
            <button aria-pressed={preferences.layout === "stacked"} title="会话停靠在工作台底部；记住此选择" onClick={() => chooseLayout("stacked")}>
              <span class="esg-layout-icon esg-layout-icon-stacked" aria-hidden="true" />底部
            </button>
            <button aria-pressed={preferences.layout === "side-by-side"} title="会话停靠在工作台右侧；记住此选择" onClick={() => chooseLayout("side-by-side")}>
              <span class="esg-layout-icon" aria-hidden="true" />右侧
            </button>
            <button aria-pressed={preferences.layout === "floating"} title="应用内浮动窗口：可拖动、缩放，不离开 OpenCode 主窗口" onClick={() => chooseLayout("floating")}>
              <span class="esg-layout-icon esg-layout-icon-floating" aria-hidden="true" />浮动窗口
            </button>
          </div>
          <Show when={preferences.notice}><span class="esg-layout-notice" role="status">{preferences.notice}</span></Show>
          <Show when={state.associated && state.pane === "esg"}>
            <button onClick={() => setState("pane", "split")}>展开当前关联会话 →</button>
          </Show>
        </header>
        <div class="esg-iframe-region">
          <iframe ref={frame} title="OpenESG 工作台原型" src="oc://esg/index.html"
            sandbox="allow-scripts allow-same-origin allow-downloads" allow="clipboard-write" />
        </div>
      </section>
      <section class="esg-native-pane" hidden={state.pane === "esg"} aria-label="OpenCode 会话工作区"
        style={isFloating() ? { left: `${floating.rect.x}px`, top: `${floating.rect.y}px`, width: `${floating.rect.width}px`, height: `${floating.rect.height}px` } : undefined}>
        <Show when={isFloating()}>
          <header class="esg-floating-toolbar">
            <button class="esg-floating-drag" title="拖动浮窗；方向键移动，Shift 加速" aria-label="移动会话浮窗"
              onPointerDown={(event) => start(event, "move")} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
              onKeyDown={(event) => nudge(event, "move")}>
              <span aria-hidden="true">⠿</span>会话 · 应用内浮窗
            </button>
            <button class="esg-floating-dock" onClick={() => chooseLayout("side-by-side")}>停靠右侧</button>
          </header>
        </Show>
        <Show when={state.associated || state.pending}>
          {(context) => <header class="esg-conversation-context">
            <div>
              <strong title={contextIdentity(context()).title}>{contextIdentity(context()).title}<span class="esg-context-kind">{contextIdentity(context()).kind}</span></strong>
              <small title={`${contextIdentity(context()).report} · ${contextIdentity(context()).ids}`}>{contextIdentity(context()).report} · {contextIdentity(context()).ids}</small>
            </div>
            <div class="esg-conversation-actions">
              <Show when={state.pane === "split"} fallback={<button onClick={() => setState("pane", "split")}>同屏查看工作台</button>}>
                <button onClick={openNativeWorkspace}>展开会话</button>
                <button onClick={back}>收起会话</button>
              </Show>
            </div>
          </header>}
        </Show>
        <div class="esg-native-content">{props.children}</div>
        <footer class="esg-conversation-tools">
          <small title={state.status}>{state.associated ? "点击时快照 · 仅预填，未调用模型" : "OpenCode 原生草稿"}</small>
          <button aria-expanded={preferences.environment} onClick={() => setPreferences("environment", !preferences.environment)} title="展开或收起原生项目、工作目录和分支选择">工作环境 {preferences.environment ? "⌃" : "⌄"}</button>
        </footer>
        <Show when={isFloating()}>
          <button class="esg-floating-resize" aria-label="调整会话浮窗大小" title="拖动调整大小；方向键调整，Shift 加速"
            onPointerDown={(event) => start(event, "resize")} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
            onKeyDown={(event) => nudge(event, "resize")}><span aria-hidden="true">◢</span></button>
        </Show>
      </section>
    </div>
  )
}

/** Uses the upstream public draft API; native session/timeline code is unchanged. */
export function ESGSessionBridge() {
  const tabs = useTabs()
  const server = useServer()
  const location = useLocation()
  const drafts = new Map<string, ESGContext>()
  const admitted = new Set<string>()
  // Also reveal native routes selected by keyboard/history, not only titlebar clicks.
  createEffect(on(() => `${location.pathname}${location.search}`, () => {
    if (!state.pending) openNativeWorkspace()
  }, { defer: true }))
  onMount(() => {
    setState({ ready: true, status: "普通 OpenCode 会话 · 不附带 ESG 上下文。" })
  })
  createEffect(() => {
    const pending = state.pending
    const directory = state.directory
    if (!state.ready || !pending || !directory || admitted.has(pending.requestId)) return
    admitted.add(pending.requestId)
    void (async () => {
      await Promise.all([server.ready.promise, tabs.ready.promise, tabs.recentReady.promise])
      server.projects.open(directory)
      const draft = await tabs.newDraft({ server: server.key, directory }, contextPrompt(pending))
      drafts.set(draft.draftID, pending)
      tabs.select(draft)
      setState({ pending: undefined, associated: pending, status: "已预填；未调用模型。" })
    })().catch((error: unknown) => {
      setState({ pending: undefined, status: `草稿创建失败：${String(error)}` })
    })
  })
  createEffect(() => {
    const draft = location.pathname === "/new-session" ? String(location.query.draftId ?? "") : ""
    const associated = drafts.get(draft)
    setState({ associated, status: associated ? "已预填；未调用模型。" : "普通 OpenCode 会话 · 不附带 ESG 上下文。" })
  })
  return null
}
