export type ScrollPane = 'source' | 'preview'

// Browser scroll events from script-set scrollTop can arrive several frames later.
// Remember their expected positions instead of using a one-frame direction lock.
export class ScrollSyncGate {
  private pending: Record<ScrollPane, number[]> = { source: [], preview: [] }
  private userPane: ScrollPane | null = null
  private userAt = 0

  // A wheel or drag establishes which pane the user is controlling. The other
  // pane may report a slightly adjusted scrollTop after the editor updates layout,
  // so coordinate equality alone cannot identify its synthetic event.
  claim(pane: ScrollPane, now = performance.now()): void {
    if (this.userPane !== pane) this.pending[pane].length = 0
    this.userPane = pane
    this.userAt = now
  }

  expect(pane: ScrollPane, position: number): void {
    this.pending[pane].push(position)
    if (this.pending[pane].length > 16) this.pending[pane].shift()
  }

  consume(pane: ScrollPane, position: number, now = performance.now()): boolean {
    if (this.userPane && pane !== this.userPane && now - this.userAt < 500) return true
    const queue = this.pending[pane]
    const index = queue.findIndex(expected => Math.abs(expected - position) < 2)
    if (index < 0) { queue.length = 0; return false }
    queue.splice(0, index + 1)
    return true
  }

  clear(): void { this.pending.source.length = 0; this.pending.preview.length = 0; this.userPane = null; this.userAt = 0 }
}
