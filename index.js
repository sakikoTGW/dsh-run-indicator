/**
 * dsh-run-indicator — 折起来也看得见在跑。
 *
 * 侧栏按工作区分组时，只有在展开状态下才能看到里面某个会话在跑（行上的状态点）。
 * 折起来之后行都不渲染，就完全没有迹象了。这个插件在**分组标题**上补一个活动点：
 * 只要组里有会话在跑且这组是折起的，标题旁边就有一颗跳动的点。
 *
 * 只读 DOM 与公开快照，不改动任何原生渲染：
 * - 分组标题：`[data-row-key^="workspace:"]`（原生 `aria-expanded` 表示展开状态）
 * - 会话行：`[data-row-key^="session:"]`，用它建立「组 → 会话」映射
 * - 运行状态：`ctx.sessions.list` 快照里的 `byId[id].running`
 *
 * @module dsh-run-indicator
 */

export const name = 'dsh-run-indicator'

/** The Client half owns everything; the Host row exists so the bundle mounts. */
export function apply() {}
