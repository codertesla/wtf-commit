import * as http from 'node:http';
import * as https from 'node:https';
import type { IncomingHttpHeaders } from 'node:http';

const DEFAULT_MAX_RESPONSE_BYTES = 256 * 1024;
const DEFAULT_MAX_ERROR_BYTES = 16 * 1024;
const DEFAULT_MAX_SSE_LINE_BYTES = 64 * 1024;

export interface TransportResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
}

interface RequestInput {
  url: string;
  body: string;
  headers: Record<string, string>;
  signal: AbortSignal;
}

export function postJson(input: RequestInput): Promise<TransportResponse> {
  return requestText(input, DEFAULT_MAX_RESPONSE_BYTES);
}

export function postSse(
  input: RequestInput,
  onData: (data: string) => void
): Promise<TransportResponse> {
  const url = new URL(input.url);
  const transport = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    if (input.signal.aborted) {
      reject(new Error('Request aborted.'));
      return;
    }

    const request = transport.request(url, {
      method: 'POST',
      headers: requestHeaders(input),
    }, (response) => {
      const status = response.statusCode || 0;
      const isSuccess = status >= 200 && status < 300;
      if (!isSuccess) {
        collectResponse(response, DEFAULT_MAX_ERROR_BYTES).then(
          (body) => resolve({ status, headers: response.headers, body }),
          reject
        );
        return;
      }

      let buffer = '';
      let totalBytes = 0;
      response.on('data', (chunk: Buffer | string) => {
        const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
        totalBytes += Buffer.byteLength(text);
        if (totalBytes > DEFAULT_MAX_RESPONSE_BYTES) {
          response.destroy(new Error('SSE response exceeded the response limit.'));
          return;
        }
        buffer += text;
        if (Buffer.byteLength(buffer) > DEFAULT_MAX_SSE_LINE_BYTES) {
          response.destroy(new Error('SSE event exceeded the response limit.'));
          return;
        }
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          consumeSseLine(line, onData);
        }
      });
      response.on('end', () => {
        if (buffer.trim()) {
          consumeSseLine(buffer, onData);
        }
        resolve({ status, headers: response.headers, body: '' });
      });
      response.on('error', reject);
    });

    attachAbort(input.signal, request, reject);
    request.end(input.body);
  });
}

function requestText(input: RequestInput, maxBytes: number): Promise<TransportResponse> {
  const url = new URL(input.url);
  const transport = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    if (input.signal.aborted) {
      reject(new Error('Request aborted.'));
      return;
    }
    const request = transport.request(url, {
      method: 'POST',
      headers: requestHeaders(input),
    }, (response) => {
      collectResponse(response, maxBytes).then(
        (body) => resolve({
          status: response.statusCode || 0,
          headers: response.headers,
          body,
        }),
        reject
      );
    });
    attachAbort(input.signal, request, reject);
    request.end(input.body);
  });
}

function requestHeaders(input: RequestInput): Record<string, string | number> {
  return {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(input.body),
    ...input.headers,
  };
}

function collectResponse(
  response: http.IncomingMessage,
  maxBytes: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    response.on('data', (chunk: Buffer | string) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += bytes.length;
      if (total > maxBytes) {
        response.destroy(new Error(`HTTP response exceeded ${maxBytes} bytes.`));
        return;
      }
      chunks.push(bytes);
    });
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    response.on('error', reject);
  });
}

function consumeSseLine(line: string, onData: (data: string) => void): void {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) {
    return;
  }
  const data = trimmed.slice(5).trimStart();
  if (data && data !== '[DONE]') {
    onData(data);
  }
}

function attachAbort(
  signal: AbortSignal,
  request: http.ClientRequest,
  reject: (reason?: unknown) => void
): void {
  const abortRequest = () => request.destroy(new Error('Request aborted.'));
  signal.addEventListener('abort', abortRequest, { once: true });
  request.on('error', reject);
  request.on('close', () => signal.removeEventListener('abort', abortRequest));
}
