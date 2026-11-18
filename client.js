/**
 * dsh-run-indicator — Client half.
 *
 * A workspace group header says how much work is going on inside the folder: a
 * live dot plus the number of conversations currently running. Collapsed groups
 * render no session rows at all, so without this the folder looks idle while its
 * conversations are still working.
 *
 * Group → session membership is learned from the rendered rows
 * (`data-row-key="session:…"`); liveness comes from the client session list
 * snapshot (`byId[id].running`), so the count keeps updating while collapsed.
 */
window.__ModuleLoader__.load({
  id: 'dsh-run-indicator',
  factory(require) {
    const NS = 'dsh-run-indicator'
    const BADGE = 'dsh-run-badge'
    const HEADER = '[data-row-key^="workspace:"]'
    const ROW = '[data-row-key^="session:"]'
    const TITLE = '[class*="_title"]'

    const STYLES = [
      '@keyframes dsh-run-pulse{0%{box-shadow:0 0 0 0 var(--dsw-alias-state-business-primary,rgba(90,160,255,.55))}',
      '70%{box-shadow:0 0 0 4px transparent}100%{box-shadow:0 0 0 0 transparent}}',
      `.${BADGE}{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:0 5px;height:16px;`,
      'border-radius:999px;flex:none;vertical-align:middle;font-size:11px;line-height:16px;font-variant-numeric:tabular-nums;',
      'color:var(--dsw-alias-state-business-primary,#5aa0ff);',
      'background:var(--dsw-alias-state-business-tertiary,rgba(90,160,255,.16))}',
      `.${BADGE}-dot{width:6px;height:6px;border-radius:50%;flex:none;`,
      'background:var(--dsw-alias-state-business-primary,#5aa0ff);animation:dsh-run-pulse 1.4s ease-out infinite}',
      `@media (prefers-reduced-motion:reduce){.${BADGE}-dot{animation:none}}`,
    ].join('')

    function installStyles() {
      const tag = document.createElement('style')
      tag.dataset.dshRunIndicator = '1'
      tag.textContent = STYLES
      document.head.appendChild(tag)
      return () => tag.remove()
    }

    /** session id → running, straight from the client session list snapshot. */
    function runningIds(ctx) {
      const running = new Set()
      try {
        const sessions = typeof ctx.get === 'function' ? ctx.get('sessions') : ctx.sessions
        const list = sessions && sessions.list ? sessions.list.getSnapshot() : null
        const byId = list && list.byId ? list.byId : null
        if (byId === null) return running
        for (const id of Object.keys(byId)) {
          const summary = byId[id]
          if (summary && summary.running === true) running.add(id)
        }
      } catch (error) { /* a missing snapshot only costs the badge */ }
      return running
    }

    function sessionIdOf(row) {
      const key = row.getAttribute('data-row-key') || ''
      return key.indexOf('session:') === 0 ? key.slice(8) : ''
    }

    function createBadge(label) {
      const badge = document.createElement('span')
      badge.className = BADGE
      badge.setAttribute('role', 'status')
      const dot = document.createElement('span')
      dot.className = BADGE + '-dot'
      const count = document.createElement('span')
      count.className = BADGE + '-count'
      badge.appendChild(dot)
      badge.appendChild(count)
      badge.title = label
      badge.setAttribute('aria-label', label)
      return badge
    }

    function apply(ctx, t) {
      /** group key → session ids last seen rendered under the group */
      const members = new Map()

      const tick = () => {
        const running = runningIds(ctx)
        for (const header of document.querySelectorAll(HEADER)) {
          const key = (header.getAttribute('data-row-key') || '').slice(10)
          const section = header.parentElement
          if (section === null) continue

          const seen = []
          for (const row of section.querySelectorAll(ROW)) {
            const id = sessionIdOf(row)
            if (id !== '') seen.push(id)
          }
          if (seen.length > 0) members.set(key, seen)

          const ids = members.get(key) || []
          let busy = 0
          for (const id of ids) if (running.has(id)) busy += 1

          let badge = header.querySelector('.' + BADGE)
          if (busy === 0) {
            if (badge !== null) badge.remove()
            continue
          }
          const label = t('busy').replace('{n}', String(busy))
          if (badge === null) {
            badge = createBadge(label)
            const title = header.querySelector(TITLE)
            if (title !== null && title.parentElement !== null) title.insertAdjacentElement('afterend', badge)
            else header.appendChild(badge)
          }
          const count = badge.querySelector('.' + BADGE + '-count')
          if (count !== null && count.textContent !== String(busy)) count.textContent = String(busy)
          if (badge.getAttribute('aria-label') !== label) {
            badge.setAttribute('aria-label', label)
            badge.title = label
          }
        }
      }

      const timer = setInterval(() => {
        if (document.hidden) return
        tick()
      }, 1000)
      tick()
      return () => {
        clearInterval(timer)
        for (const badge of document.querySelectorAll('.' + BADGE)) badge.remove()
      }
    }

    return {
      inject: ['locale'],
      apply(ctx) {
        ctx.effect(() => installStyles(), 'dsh-run-indicator: styles')
        ctx.effect(
          () =>
            ctx.locale.register(NS, {
              zh: { busy: '{n} 个会话运行中' },
              en: { busy: '{n} conversations running' },
            }),
          'dsh-run-indicator: dictionaries',
        )
        const t = ctx.locale.bind(NS)
        ctx.effect(() => apply(ctx, t), 'dsh-run-indicator: watcher')
      },
    }
  },
})
