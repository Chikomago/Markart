import { defineComponent, h } from 'vue'

function icon(name: string, viewBox: string, paths: Record<string,string>[], options: { className?: string; scale?: number } = {}) {
  return defineComponent({
    name,
    props: { size: { type: Number, default: 14 } },
    setup: props => () => h('svg', {
      xmlns: 'http://www.w3.org/2000/svg', width: props.size, height: props.size,
      viewBox, class: options.className, 'aria-hidden': 'true',
      style: options.scale ? { transform: `scale(${options.scale})` } : undefined,
    }, paths.map(path => h('path', path))),
  })
}

export const FileFilterIcon = icon('FileFilterIcon', '0 0 1024 1024', [
  {"d": "M0 0h1024v1024H0z", "fill": "none"},
  {"fill": "currentColor", "d": "M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48M603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6z"}
], { scale: 1.1 })

export const FileTreeViewIcon = icon('FileTreeViewIcon', '0 0 20 20', [
  {"d": "M0 0h20v20H0z", "fill": "none"},
  {"fill": "currentColor", "d": "m12.333 1.582l.111.013a.5.5 0 0 1 .28.175l.85 1.062H17.5a.5.5 0 0 1 .5.5v4.167a.5.5 0 0 1-.5.5H9.167a.5.5 0 0 1-.5-.5V2.082a.5.5 0 0 1 .5-.5zM9.667 6.999H17V3.832h-3.667a.5.5 0 0 1-.39-.187l-.85-1.063H9.667zm2.666 4.583l.111.013a.5.5 0 0 1 .28.175l.85 1.062H17.5a.5.5 0 0 1 .5.5v4.167a.5.5 0 0 1-.5.5H9.167a.5.5 0 0 1-.5-.5v-5.417a.5.5 0 0 1 .5-.5zm-2.666 5.417H17v-3.167h-3.667a.5.5 0 0 1-.39-.187l-.85-1.063H9.667z"},
  {"fill": "currentColor", "d": "M2.833 1.668a.5.5 0 0 1 1 0v13.25h5.334v1H3.333a.5.5 0 0 1-.5-.5z"},
  {"fill": "currentColor", "d": "M9.167 4.918v1H3.333v-1z"}
], { className: 'file-tree-view-icon' })

export const RecentModifiedIcon = icon('RecentModifiedIcon', '0 0 24 24', [
  {"d": "M0 0h24v24H0z", "fill": "none"},
  {"fill": "currentColor", "fill-rule": "evenodd", "d": "M1.25 7A.75.75 0 0 1 2 6.25h8a.75.75 0 0 1 0 1.5H2A.75.75 0 0 1 1.25 7M17 7.75a4.25 4.25 0 1 0 0 8.5a4.25 4.25 0 0 0 0-8.5M11.25 12a5.75 5.75 0 1 1 11.5 0a5.75 5.75 0 0 1-11.5 0M17 9.25a.75.75 0 0 1 .75.75v1.566l.817.943a.75.75 0 0 1-1.134.982l-1-1.154a.75.75 0 0 1-.183-.49V10a.75.75 0 0 1 .75-.75M1.25 12a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75m0 5a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75", "clip-rule": "evenodd"}
], { scale: 1.25 })
