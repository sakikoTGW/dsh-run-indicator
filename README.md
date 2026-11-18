# dsh-run-indicator

DSH 侧栏按工作区分组时，会话行上的"运行中"标记只有在**展开**状态下才看得见 —— 组一折起来，
行不渲染，文件夹看起来就像空闲的。这个插件把计数搬到组标题上。

## 效果

```
📁 Anonbot  ● 2
```

- 组标题右侧一颗跳动的圆点 + 数字：这个文件夹里有几个会话在跑
- 展开、折起都显示；折起时尤其重要
- 数字实时更新（500ms），全部跑完徽标消失
- 悬浮提示 / 读屏标签：`2 个会话运行中`
- `prefers-reduced-motion` 下圆点不跳

## 安装

```bash
dsh plugin --profile desktop add dsh-run-indicator
```

## 实现

只读 DOM 与公开快照，不改动原生渲染：

| 数据 | 来源 |
|---|---|
| 分组标题 | `[data-row-key^="workspace:"]`，展开状态看 `aria-expanded` |
| 组 → 会话 | 渲染出来的行 `[data-row-key^="session:"]` |
| 运行状态 | `ctx.sessions.list` 快照里的 `byId[id].running` |

每次 tick 合并"组的成员集合"和"谁在跑"，在标题后面维护一枚徽标。

## 已知限制

某个组如果**从未展开过**（这一轮没渲染过任何行），插件没有它的成员映射，折起状态不会显示数字；
展开过一次之后一直记得。

## 许可

MIT
