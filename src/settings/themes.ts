import sky from '../themes/sky/theme.json'
import skyCss from '../themes/sky/theme.css?raw'
import clay from '../themes/clay/theme.json'
import clayCss from '../themes/clay/theme.css?raw'
import deep from '../themes/deep/theme.json'
import deepCss from '../themes/deep/theme.css?raw'
import white from '../themes/white/theme.json'
import whiteCss from '../themes/white/theme.css?raw'
import graphite from '../themes/graphite/theme.json'
import graphiteCss from '../themes/graphite/theme.css?raw'

// Built-in palettes share the same semantic tokens as custom and plugin themes.
export const builtinThemes = [
  { ...sky, css: skyCss },
  { ...clay, css: clayCss },
  { ...deep, css: deepCss },
  { ...white, css: whiteCss },
  { ...graphite, css: graphiteCss },
]
