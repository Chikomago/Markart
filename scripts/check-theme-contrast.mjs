import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const css = ['sky','clay','deep','white','graphite'].map(name => readFileSync(`src/themes/${name}/theme.css`, 'utf8')).join('\n')
const luminance = hex => {
  const [r,g,b] = hex.slice(1).match(/../g).map(value => parseInt(value,16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4)
  return r*.2126+g*.7152+b*.0722
}
const ratio = (a,b) => { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05) }
let count=0
for (const [,selector,body] of css.matchAll(/(\.app-shell(?:\.theme-\w+)?)\s*\{([^}]+)\}/g)) {
  const tokens=Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/g)].map(match=>[match[1],match[2]]))
  for (const text of ['ink','muted','accent']) for (const surface of ['paper','panel','bg']) {
    const contrast=ratio(tokens[text],tokens[surface])
    assert(contrast>=4.5,`${selector} ${text}/${surface}: ${contrast.toFixed(2)}`)
    count++
  }
}
assert.equal(count,45)
console.log(`PASS ${count} theme foreground/surface pairs meet 4.5:1`)
