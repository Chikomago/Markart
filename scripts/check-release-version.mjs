import { readFileSync } from 'node:fs'

const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version
const tauriVersion = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version
const cargoVersion = readFileSync('src-tauri/Cargo.toml', 'utf8').match(/^version = "([^"]+)"/m)?.[1]
const tag = process.env.GITHUB_REF_NAME

if (packageVersion !== tauriVersion || packageVersion !== cargoVersion || (tag && tag !== `v${packageVersion}`)) {
  console.error(`版本不一致：package=${packageVersion} Tauri=${tauriVersion} Cargo=${cargoVersion} tag=${tag || '未设置'}`)
  process.exitCode = 1
}
