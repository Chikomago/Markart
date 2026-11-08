# 发布 Markart

1. 确保 `package.json`、`src-tauri/Cargo.toml` 和 `src-tauri/tauri.conf.json` 的版本一致。
2. 在 GitHub 仓库设置中配置 `TAURI_SIGNING_PRIVATE_KEY`，值为本机 `~/.tauri/markart.key` 的完整内容。私钥只保存在本机和 GitHub Actions Secret 中，不提交到仓库；丢失私钥后，已安装的版本将无法验证后续更新。
3. 推送 `v<版本>` 标签。`.github/workflows/release.yml` 会构建并发布各平台安装包、签名和 `latest.json`。
4. 发布后检查 Release 附件和 `latest.json`，再用旧版本应用验证“关于”中的更新流程。

macOS 当前使用临时签名；Windows 安装包当前未配置商业代码签名证书。正式分发时可能出现系统安全提示。
