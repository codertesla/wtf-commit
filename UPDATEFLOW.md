# 插件更新工作流

1. **准备发布内容**
   - 更新 `package.json` 中的版本号。
   - 将本次更新内容写入 `CHANGELOG.md`，并填写发布日期。
   - 更新中英文 `README.md` / `README_zh.md` 中的版本号、最新功能和配置说明。

2. **测试验证**
   ```bash
   pnpm run compile
   pnpm run lint
   pnpm run test:unit
   pnpm test
   pnpm run package
   git diff --check
   ```
   确认编译、Lint、单元测试、VS Code 扩展宿主测试和 VSIX 打包全部通过。

3. **提交并推送代码到远程仓库**
   ```bash
   VERSION=$(node -p "require('./package.json').version")
   BRANCH=$(git branch --show-current)
   test -n "${BRANCH}"

   git status --short
   git add -p
   # 对属于本次发布的新文件逐个执行：git add path/to/new-file
   git diff --cached --name-status
   git diff --cached --check
   git diff --cached --stat
   git commit -m "chore(release): 发布 v${VERSION}"
   git push origin "${BRANCH}"
   ```
   - 提交前确认暂存区只包含本次发布内容，不要使用不加检查的 `git add -A`。
   - 推送成功后确认本地分支与远程分支一致。

4. **发布 Open VSX**
   ```bash
   pnpm run release
   ```

5. **发布后验证**
   - 确认 Open VSX 对应版本页面及下载文件可访问。
   - 确认远程仓库包含本次发布提交。
   - 执行 `git status --short`，确认工作区没有遗漏的发布改动。

## 补充说明

- Open VSX 发布优先读取环境变量 `OVSX_PAT`。
- 在 macOS 上，如果未设置 `OVSX_PAT`，发布脚本会自动从 Keychain 的 `wtf-commit.ovsx` 服务中读取 token。
- 如果代码推送失败，应先解决远程同步问题，不要继续发布 Open VSX。
- 如果 Open VSX 发布失败，不要重复修改或复用已经发布过的版本号；确认失败状态后再决定重试或升级补丁版本。
