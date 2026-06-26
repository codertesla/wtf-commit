export type UiLanguage = 'en' | 'zh';

export type MessageKey =
  | 'statusBarButtonTooltip'
  | 'noChangesDetected'
  | 'noDiffContent'
  | 'diffTruncatedWarning'
  | 'untrackedOmittedWarning'
  | 'generatingProgress'
  | 'repairingProgress'
  | 'pushingProgress'
  | 'pushSuccessful'
  | 'commitSuccessful'
  | 'autoPushSkipped'
  | 'autoPushRequiresAutoCommit'
  | 'autoPushNeedsAutoCommit'
  | 'enableAutoCommit'
  | 'dismiss'
  | 'messageReadyInScm'
  | 'cancelled'
  | 'apiKeyNotSet'
  | 'setApiKey'
  | 'apiKeySaved'
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
  | 'generatedEmpty'
  | 'repairEmpty'
  | 'repairRemainingIssues'
  | 'needsAdjustment'
  | 'aiRepair'
  | 'keepOriginal'
  | 'repairFailedOriginalKept'
  | 'mixedStageWarning'
  | 'useStagedChanges'
  | 'dontRemindMe'
  | 'openSourceControl'
  | 'openSettings'
  | 'cancel'
  | 'readyToCommit'
  | 'commit'
  | 'editInSourceControl'
  | 'pushNowConfirm'
  | 'push'
  | 'authFailed'
  | 'invalidApiResponse'
  | 'undoCommit'
  | 'welcomeTitle'
  | 'remindMeLater'
  | 'dontShowAgain'
  | 'updatedToVersion'
  | 'viewChangelog'
  | 'providerPickerSwitchTitle'
  | 'pushCompletedWithRefreshWarning';

type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  statusBarButtonTooltip: 'WTF Commit: Generate commit message',
  noChangesDetected: 'No changes detected in working tree or staging area.',
  noDiffContent: 'No diff content found.',
  diffTruncatedWarning:
    'The diff is large; only a summarized/partial diff was sent to the AI. The commit message may be less precise.',
  untrackedOmittedWarning:
    '{count} untracked file(s) were omitted (limit: {cap}). Raise "Wtf Commit: Max Untracked Files" to include more.',
  generatingProgress: 'Generating commit message...',
  repairingProgress: 'Repairing commit message...',
  pushingProgress: 'Pushing changes...',
  pushSuccessful: 'Push successful.',
  commitSuccessful: 'Commit successful.',
  autoPushSkipped: 'Auto Push skipped. Commit is local only.',
  autoPushRequiresAutoCommit:
    'Auto Push requires Auto Commit. Message ready in Source Control.',
  autoPushNeedsAutoCommit:
    'Auto Push is enabled but Auto Commit is off, so pushes will never happen. Enable Auto Commit to make Auto Push effective?',
  enableAutoCommit: 'Enable Auto Commit',
  dismiss: 'Dismiss',
  messageReadyInScm: 'Commit message ready in Source Control.',
  cancelled: 'Commit generation cancelled.',
  apiKeyNotSet: 'API Key for {provider} is not set.',
  setApiKey: 'Set API Key',
  apiKeySaved: 'API key saved for {provider}.',
  apiKeySavedSwitched: 'API Key for {provider} saved. Switch the active provider to {provider}?',
  apiKeySwitchedTo: 'API Key for {provider} saved. Active provider is now {provider}.',
  apiKeySavedUnchanged:
    'API Key for {provider} saved. Active provider unchanged ({current}).',
  switchProvider: 'Switch Provider',
  keepCurrent: 'Keep Current',
  selectProviderPlaceholder: 'Select Provider to set API Key for',
  providerStatusTitle: 'WTF Commit: Provider Status',
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
  generatedEmpty: 'Generated commit message is empty. Please try again.',
  repairEmpty: 'AI repair returned an empty commit message. Please try again.',
  repairRemainingIssues:
    'AI repair completed, but {count} issue(s) remain: {detail}',
  needsAdjustment: 'Generated message needs adjustment: {detail}',
  aiRepair: 'AI Repair',
  keepOriginal: 'Keep Original',
  repairFailedOriginalKept: 'AI repair failed. Original message kept in Source Control.',
  mixedStageWarning:
    'Staged and unstaged changes were both detected. WTF Commit will generate from staged changes only.',
  useStagedChanges: 'Use Staged Changes',
  dontRemindMe: "Don't Remind Me",
  openSourceControl: 'Open Source Control',
  openSettings: 'Open Settings',
  cancel: 'Cancel',
  readyToCommit: 'Ready to commit',
  commit: 'Commit',
  editInSourceControl: 'Edit in Source Control',
  pushNowConfirm: 'Push the commit to the remote now?',
  push: 'Push',
  authFailed: 'Authentication failed ({status})',
  invalidApiResponse: 'Invalid API response: {message}',
  undoCommit: 'Undo Commit',
  welcomeTitle:
    'Welcome to WTF Commit! Set up an API key to start generating commit messages with AI.',
  remindMeLater: 'Remind Me Later',
  dontShowAgain: "Don't Show Again",
  updatedToVersion: 'WTF Commit has been updated to v{version}!',
  viewChangelog: 'View Changelog',
  providerPickerSwitchTitle: 'WTF Commit: Provider Status',
  pushCompletedWithRefreshWarning: 'Push completed with a follow-up refresh warning.',
};

const zh: Dictionary = {
  statusBarButtonTooltip: 'WTF Commit：生成提交信息',
  noChangesDetected: '工作区与暂存区均无变更。',
  noDiffContent: '未找到 diff 内容。',
  diffTruncatedWarning: 'diff 较大，仅向 AI 发送了摘要/部分 diff，提交信息可能不够精确。',
  untrackedOmittedWarning:
    '已省略 {count} 个未跟踪文件（上限 {cap}）。可在「Wtf Commit: Max Untracked Files」调高以纳入更多。',
  generatingProgress: '正在生成提交信息...',
  repairingProgress: '正在修复提交信息...',
  pushingProgress: '正在推送变更...',
  pushSuccessful: '推送成功。',
  commitSuccessful: '提交成功。',
  autoPushSkipped: '已跳过 Auto Push，提交仅保留在本地。',
  autoPushRequiresAutoCommit: 'Auto Push 需要先开启 Auto Commit。提交信息已就绪于源代码管理。',
  autoPushNeedsAutoCommit:
    '已开启 Auto Push 但 Auto Commit 处于关闭状态，推送不会生效。是否开启 Auto Commit 让 Auto Push 生效？',
  enableAutoCommit: '开启 Auto Commit',
  dismiss: '忽略',
  messageReadyInScm: '提交信息已就绪于源代码管理。',
  cancelled: '已取消提交信息生成。',
  apiKeyNotSet: '尚未设置 {provider} 的 API Key。',
  setApiKey: '设置 API Key',
  apiKeySaved: '已保存 {provider} 的 API Key。',
  apiKeySavedSwitched: '已保存 {provider} 的 API Key。是否将当前 Provider 切换为 {provider}？',
  apiKeySwitchedTo: '已保存 {provider} 的 API Key。当前 Provider 已切换为 {provider}。',
  apiKeySavedUnchanged: '已保存 {provider} 的 API Key。当前 Provider 未变（{current}）。',
  switchProvider: '切换 Provider',
  keepCurrent: '保持当前',
  selectProviderPlaceholder: '选择要设置 API Key 的 Provider',
  providerStatusTitle: 'WTF Commit：Provider 状态',
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
  generatedEmpty: '生成的提交信息为空，请重试。',
  repairEmpty: 'AI 修复返回了空提交信息，请重试。',
  repairRemainingIssues: 'AI 修复完成，但仍有 {count} 个问题：{detail}',
  needsAdjustment: '提交信息需要调整：{detail}',
  aiRepair: 'AI 修复',
  keepOriginal: '保留原信息',
  repairFailedOriginalKept: 'AI 修复失败，原信息已保留在源代码管理中。',
  mixedStageWarning: '同时检测到已暂存与未暂存变更。WTF Commit 将仅基于已暂存变更生成。',
  useStagedChanges: '使用已暂存变更',
  dontRemindMe: '不再提醒',
  openSourceControl: '打开源代码管理',
  openSettings: '打开设置',
  cancel: '取消',
  readyToCommit: '准备提交',
  commit: '提交',
  editInSourceControl: '在源代码管理中编辑',
  pushNowConfirm: '现在推送到远程吗？',
  push: '推送',
  authFailed: '认证失败（{status}）',
  invalidApiResponse: '无效的 API 响应：{message}',
  undoCommit: '撤销提交',
  welcomeTitle: '欢迎使用 WTF Commit！设置 API Key 即可开始用 AI 生成提交信息。',
  remindMeLater: '稍后提醒',
  dontShowAgain: '不再显示',
  updatedToVersion: 'WTF Commit 已更新到 v{version}！',
  viewChangelog: '查看更新日志',
  providerPickerSwitchTitle: 'WTF Commit：Provider 状态',
  pushCompletedWithRefreshWarning: '推送完成，但有一个后续刷新警告。',
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
  if (value === 'zh') {
    return 'zh';
  }
  return 'en';
}
