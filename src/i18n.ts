export type UiLanguage = 'en' | 'zh';

export type MessageKey =
  | 'statusBarButtonTooltip'
  | 'generateInProgress'
  | 'noChangesDetected'
  | 'noDiffContent'
  | 'diffTruncatedStatusTip'
  | 'generatingProgress'
  | 'repairingProgress'
  | 'autoRepairing'
  | 'pushingProgress'
  | 'pushSuccessful'
  | 'commitSuccessful'
  | 'commitSuccessfulUnstagedRemain'
  | 'autoPushSkipped'
  | 'autoPushNeedsAutoCommit'
  | 'enableAutoCommit'
  | 'dismiss'
  | 'messageReadyInScm'
  | 'cancelled'
  | 'apiKeyNotSet'
  | 'setApiKey'
  | 'getApiKey'
  | 'enterApiKeyContinue'
  | 'setApiKeyHint'
  | 'setApiKeyFlowTitle'
  | 'setKeyForDefaultProvider'
  | 'setKeyForCurrentProvider'
  | 'defaultProviderBadge'
  | 'chooseOtherProvider'
  | 'chooseOtherProviderDetail'
  | 'apiKeySavedSwitched'
  | 'apiKeySwitchedTo'
  | 'apiKeySavedUnchanged'
  | 'switchProvider'
  | 'keepCurrent'
  | 'selectProviderPlaceholder'
  | 'providerStatusTitle'
  | 'current'
  | 'apiKeySet'
  | 'apiKeyNotSetLabel'
  | 'setApiKeyTitle'
  | 'enterApiKeyPrompt'
  | 'failedToSaveKey'
  | 'generateFailed'
  | 'gitExtensionMissing'
  | 'noGitRepo'
  | 'selectRepoPlaceholder'
  | 'repoPickerTitle'
  | 'noStageableChanges'
  | 'noStagedSnapshot'
  | 'stagedSnapshotChanged'
  | 'generateAgain'
  | 'generatedEmpty'
  | 'repairRemainingIssues'
  | 'repairFailedOriginalKept'
  | 'mixedStageStatusTip'
  | 'workingTreeOnlyWarning'
  | 'useWorkingTreeChanges'
  | 'dontRemindMe'
  | 'openSourceControl'
  | 'openSettings'
  | 'providerBaseUrlMissing'
  | 'providerModelMissing'
  | 'cancel'
  | 'pushNowConfirm'
  | 'push'
  | 'authFailed'
  | 'invalidApiResponse'
  | 'undoCommit'
  | 'welcomeTitle'
  | 'remindMeLater'
  | 'dontShowAgain'
  | 'providerPickerSwitchTitle'
  | 'pushCompletedWithRefreshWarning'
  | 'gitRefreshLabel'
  | 'pushSucceededWithFollowup'
  | 'pushMayHaveSucceeded'
  | 'pushFailedAfterCommit'
  | 'legacyProviderMigrated';

type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  statusBarButtonTooltip: 'WTF Commit: Generate commit message',
  generateInProgress: 'Commit message generation already in progress.',
  noChangesDetected: 'No changes detected in working tree or staging area.',
  noDiffContent: 'No diff content found.',
  diffTruncatedStatusTip: 'Diff is large — only a summary was sent to the AI.',
  generatingProgress: 'Generating commit message...',
  repairingProgress: 'Repairing commit message...',
  autoRepairing: 'Fixing commit message format...',
  pushingProgress: 'Pushing changes...',
  pushSuccessful: 'Push successful.',
  commitSuccessful: 'Commit successful.',
  commitSuccessfulUnstagedRemain: 'Commit successful. {count} unstaged file(s) left untouched.',
  autoPushSkipped: 'Auto Push skipped. Commit is local only.',
  autoPushNeedsAutoCommit:
    'Auto Push needs Auto Commit on. Enable Auto Commit so push can run after generate?',
  enableAutoCommit: 'Enable Auto Commit',
  dismiss: 'Dismiss',
  messageReadyInScm: 'Commit message ready in Source Control.',
  cancelled: 'Commit generation cancelled.',
  apiKeyNotSet: 'API Key for {provider} is not set.',
  setApiKey: 'Set API Key',
  getApiKey: 'Get API Key',
  enterApiKeyContinue: 'I have a key',
  setApiKeyHint: 'Paste your {provider} API key next. Need one? Open the key page first.',
  setApiKeyFlowTitle: 'WTF Commit: Set API Key',
  setKeyForDefaultProvider: 'Set key for {provider} (default)',
  setKeyForCurrentProvider: 'Set key for {provider} (current)',
  defaultProviderBadge: 'default',
  chooseOtherProvider: 'Choose another provider…',
  chooseOtherProviderDetail: 'Only if you are not using the default DeepSeek provider.',
  apiKeySavedSwitched: 'API Key for {provider} saved. Switch the active provider to {provider}?',
  apiKeySwitchedTo: 'API Key for {provider} saved. Active provider is now {provider}.',
  apiKeySavedUnchanged:
    'API Key for {provider} saved. Active provider unchanged ({current}).',
  switchProvider: 'Switch Provider',
  keepCurrent: 'Keep Current',
  selectProviderPlaceholder: 'Select Provider to set API Key for',
  providerStatusTitle: 'WTF Commit: Choose Provider',
  current: 'current',
  apiKeySet: 'API Key set',
  apiKeyNotSetLabel: 'API Key not set',
  setApiKeyTitle: 'Set API Key for {provider}',
  enterApiKeyPrompt: 'Enter your API Key',
  failedToSaveKey: 'Failed to save API key: {message}',
  generateFailed: 'Failed: {message}',
  gitExtensionMissing: 'Git extension is not available.',
  noGitRepo: 'No Git repository found.',
  selectRepoPlaceholder: 'Select a Git repository',
  repoPickerTitle: 'WTF Commit: Repository Picker',
  noStageableChanges: 'No stageable changes found. Please refresh Source Control and try again.',
  noStagedSnapshot: 'No staged snapshot is available for Auto Commit.',
  stagedSnapshotChanged:
    'Staged changes changed while the commit message was being generated. Review the changes and generate again.',
  generateAgain: 'Generate Again',
  generatedEmpty: 'Generated commit message is empty. Please try again.',
  repairRemainingIssues:
    'AI repair completed, but {count} issue(s) remain: {detail}',
  repairFailedOriginalKept: 'AI repair failed. Original message kept.',
  mixedStageStatusTip: 'Using staged changes only — unstaged files will not be committed.',
  workingTreeOnlyWarning:
    'Nothing is staged. Generate a commit message from working tree changes? Stage the files yourself before committing.',
  useWorkingTreeChanges: 'Use Working Tree',
  dontRemindMe: "Don't Remind Me",
  openSourceControl: 'Open Source Control',
  openSettings: 'Open Settings',
  providerBaseUrlMissing:
    'Base URL is missing for {provider}. For **Custom**, set Base URL under Settings → WTF Commit › Advanced. Built-in providers use Provider Overrides instead.',
  providerModelMissing:
    'Model is missing for {provider}. For **Custom**, set Model under Settings → WTF Commit › Advanced. Built-in providers use Provider Overrides instead.',
  cancel: 'Cancel',
  pushNowConfirm: 'Push the commit to the remote now?',
  push: 'Push',
  authFailed: 'Authentication failed ({status})',
  invalidApiResponse: 'Invalid API response: {message}',
  undoCommit: 'Undo Commit',
  welcomeTitle:
    'Welcome to WTF Commit! Default provider is DeepSeek — set an API key once, then generate with your shortcut (Cmd/Ctrl+Alt+G).',
  remindMeLater: 'Remind Me Later',
  dontShowAgain: "Don't Show Again",
  providerPickerSwitchTitle: 'WTF Commit: Choose Provider',
  pushCompletedWithRefreshWarning: 'Push completed with a follow-up refresh warning.',
  gitRefreshLabel: 'Git repository refresh',
  pushSucceededWithFollowup: 'Push succeeded, but {command} failed afterward: {detail}',
  pushMayHaveSucceeded: 'Push may have succeeded, but {command} failed afterward: {detail}',
  pushFailedAfterCommit: 'Commit successful, but push failed: {detail}',
  legacyProviderMigrated:
    'Migrated provider setting ({providers}) to Custom — Base URL and Model were filled in. Your API key was kept when possible.',
};

const zh: Dictionary = {
  statusBarButtonTooltip: 'WTF Commit：生成提交信息',
  generateInProgress: '正在生成提交信息，请稍候。',
  noChangesDetected: '工作区与暂存区均无变更。',
  noDiffContent: '未找到 diff 内容。',
  diffTruncatedStatusTip: 'diff 较大，仅向 AI 发送了摘要。',
  generatingProgress: '正在生成提交信息...',
  repairingProgress: '正在修复提交信息...',
  autoRepairing: '正在自动修复提交信息格式...',
  pushingProgress: '正在推送变更...',
  pushSuccessful: '推送成功。',
  commitSuccessful: '提交成功。',
  commitSuccessfulUnstagedRemain: '提交成功。另有 {count} 个未暂存文件未纳入本次提交。',
  autoPushSkipped: '已跳过 Auto Push，提交仅保留在本地。',
  autoPushNeedsAutoCommit: 'Auto Push 需要先开启 Auto Commit。是否开启 Auto Commit？',
  enableAutoCommit: '开启 Auto Commit',
  dismiss: '忽略',
  messageReadyInScm: '提交信息已就绪于源代码管理。',
  cancelled: '已取消提交信息生成。',
  apiKeyNotSet: '尚未设置 {provider} 的 API Key。',
  setApiKey: '设置 API Key',
  getApiKey: '申请 API Key',
  enterApiKeyContinue: '我已有 Key',
  setApiKeyHint: '接下来粘贴 {provider} 的 API Key。还没有？可先打开申请页。',
  setApiKeyFlowTitle: 'WTF Commit：设置 API Key',
  setKeyForDefaultProvider: '为 {provider} 设置 Key（默认）',
  setKeyForCurrentProvider: '为 {provider} 设置 Key（当前）',
  defaultProviderBadge: '默认',
  chooseOtherProvider: '选择其他服务商…',
  chooseOtherProviderDetail: '仅当你不使用默认的 DeepSeek 时再选。',
  apiKeySavedSwitched: '已保存 {provider} 的 API Key。是否将当前 Provider 切换为 {provider}？',
  apiKeySwitchedTo: '已保存 {provider} 的 API Key。当前 Provider 已切换为 {provider}。',
  apiKeySavedUnchanged: '已保存 {provider} 的 API Key。当前 Provider 未变（{current}）。',
  switchProvider: '切换 Provider',
  keepCurrent: '保持当前',
  selectProviderPlaceholder: '选择要设置 API Key 的 Provider',
  providerStatusTitle: 'WTF Commit：选择服务商',
  current: '当前',
  apiKeySet: '已设置 API Key',
  apiKeyNotSetLabel: '未设置 API Key',
  setApiKeyTitle: '为 {provider} 设置 API Key',
  enterApiKeyPrompt: '输入你的 API Key',
  failedToSaveKey: '保存 API Key 失败：{message}',
  generateFailed: '失败：{message}',
  gitExtensionMissing: 'Git 扩展不可用。',
  noGitRepo: '未找到 Git 仓库。',
  selectRepoPlaceholder: '选择一个 Git 仓库',
  repoPickerTitle: 'WTF Commit：仓库选择',
  noStageableChanges: '没有可暂存的变更，请刷新源代码管理后重试。',
  noStagedSnapshot: 'Auto Commit 缺少可用的暂存快照。',
  stagedSnapshotChanged: '生成提交信息期间暂存区发生变更，请检查后重新生成。',
  generateAgain: '重新生成',
  generatedEmpty: '生成的提交信息为空，请重试。',
  repairRemainingIssues: 'AI 修复完成，但仍有 {count} 个问题：{detail}',
  repairFailedOriginalKept: 'AI 修复失败，已保留原信息。',
  mixedStageStatusTip: '仅使用已暂存变更 — 未暂存文件不会进入本次提交。',
  workingTreeOnlyWarning:
    '暂存区为空。是否基于工作区变更生成提交信息？提交前请自行 stage 相关文件。',
  useWorkingTreeChanges: '使用工作区变更',
  dontRemindMe: '不再提醒',
  openSourceControl: '打开源代码管理',
  openSettings: '打开设置',
  providerBaseUrlMissing:
    '{provider} 缺少 Base URL。**Custom** 请在设置 → WTF Commit › Advanced 填写 Base URL；内置服务商请用 Provider Overrides。',
  providerModelMissing:
    '{provider} 缺少 Model。**Custom** 请在设置 → WTF Commit › Advanced 填写 Model；内置服务商请用 Provider Overrides。',
  cancel: '取消',
  pushNowConfirm: '现在推送到远程吗？',
  push: '推送',
  authFailed: '认证失败（{status}）',
  invalidApiResponse: '无效的 API 响应：{message}',
  undoCommit: '撤销提交',
  welcomeTitle:
    '欢迎使用 WTF Commit！默认服务商是 DeepSeek — 先设置一次 API Key，再用快捷键生成（Cmd/Ctrl+Alt+G）。',
  remindMeLater: '稍后提醒',
  dontShowAgain: '不再显示',
  providerPickerSwitchTitle: 'WTF Commit：选择服务商',
  pushCompletedWithRefreshWarning: '推送完成，但有一个后续刷新警告。',
  gitRefreshLabel: 'Git 仓库刷新',
  pushSucceededWithFollowup: '推送已成功，但随后 {command} 失败：{detail}',
  pushMayHaveSucceeded: '推送可能已成功，但随后 {command} 失败：{detail}',
  pushFailedAfterCommit: '提交成功，但推送失败：{detail}',
  legacyProviderMigrated:
    '已将服务商设置（{providers}）迁移为 Custom，并填入 Base URL / Model；API Key 在可能时已保留。',
};

const dictionaries: Record<UiLanguage, Dictionary> = { en, zh };

let currentLanguage: UiLanguage = 'en';

export function setUiLanguage(language: UiLanguage): void {
  currentLanguage = language;
}

export function getUiLanguage(): UiLanguage {
  return currentLanguage;
}

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const dictionary = dictionaries[currentLanguage] || dictionaries.en;
  let value = dictionary[key];
  if (value === undefined) {
    value = dictionaries.en[key];
  }
  if (params) {
    for (const [param, replacement] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), String(replacement));
    }
  }
  return value;
}

export function asUiLanguage(value: string | undefined): UiLanguage {
  if (!value) {
    return 'en';
  }
  // vscode.env.language uses BCP-47 tags (e.g. zh-cn, zh-tw, fr, en).
  // We only ship en/zh dictionaries — anything else falls back to English.
  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh';
  }
  return 'en';
}
