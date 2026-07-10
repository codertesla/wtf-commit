import type * as vscode from 'vscode';
import { getErrorMessage } from './errors';

let outputChannel: vscode.OutputChannel | undefined;

export function setOutputChannel(channel: vscode.OutputChannel): void {
  outputChannel = channel;
}

export function logInfo(message: string): void {
  outputChannel?.appendLine(`[INFO] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  if (error) {
    outputChannel?.appendLine(`[ERROR] ${message}: ${getErrorMessage(error)}`);
  } else {
    outputChannel?.appendLine(`[ERROR] ${message}`);
  }
}
