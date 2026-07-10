import * as vscode from 'vscode';

export const STATUS_MESSAGE_TIMEOUT_MS = 5_000;
export const LONG_STATUS_MESSAGE_TIMEOUT_MS = 8_000;

export function showStatusMessage(text: string, hideAfterMs = STATUS_MESSAGE_TIMEOUT_MS): void {
  vscode.window.setStatusBarMessage(text, hideAfterMs);
}
