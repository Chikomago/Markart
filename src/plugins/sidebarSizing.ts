export function equalSidebarShares(count: number): number[] { return Array.from({ length: count }, () => 1 / count) }
export function resizeSidebarPair(shares: readonly number[], index: number, delta: number, pairPixels: number): number[] {
  const next = [...shares]
  if (index < 0 || index + 1 >= shares.length || !Number.isFinite(delta) || pairPixels <= 0) return next
  const total = shares[index] + shares[index + 1], minimum = Math.min(32 / pairPixels, .5) * total
  next[index] = Math.max(minimum, Math.min(total - minimum, shares[index] + delta / pairPixels * total))
  next[index + 1] = total - next[index]
  return next
}
