/** Map scroll positions by document progress, independent of rendered height. */
export class SplitScrollMapper {
  constructor(private readonly sourceEnd: number, private readonly previewEnd: number) {}

  fromSource(scrollTop: number): number {
    if (this.sourceEnd <= 0) return 0
    return Math.max(0, Math.min(1, scrollTop / this.sourceEnd)) * this.previewEnd
  }

  fromPreview(scrollTop: number): number {
    if (this.previewEnd <= 0) return 0
    return Math.max(0, Math.min(1, scrollTop / this.previewEnd)) * this.sourceEnd
  }
}
