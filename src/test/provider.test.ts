import * as assert from 'node:assert';
import * as http from 'node:http';
import { describe, it } from 'mocha';
import type * as vscode from 'vscode';
import {
  buildProviderEndpoint,
  buildRepairPrompt,
  callLLM,
  extractResponseContent,
  REPAIR_DIFF_MAX_CHARS,
} from '../llm/provider';
import { RequestFailure } from '../types';

const cancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: () => ({ dispose: () => undefined }),
} as unknown as vscode.CancellationToken;

describe('buildRepairPrompt', () => {
  it('should include validation issue and message', () => {
    const prompt = buildRepairPrompt('feat add login', 'Missing colon after type.');
    assert.ok(prompt.includes('feat add login'));
    assert.ok(prompt.includes('Missing colon after type.'));
  });

  it('should append capped diff context when provided', () => {
    const prompt = buildRepairPrompt('feat: add login', 'too long', 'diff --git a/a.ts b/a.ts\n+hello');
    assert.ok(prompt.includes('Git diff context'));
    assert.ok(prompt.includes('diff --git a/a.ts b/a.ts'));
  });

  it('should truncate oversized diff context', () => {
    const hugeDiff = 'x'.repeat(REPAIR_DIFF_MAX_CHARS + 500);
    const prompt = buildRepairPrompt('feat: x', 'length', hugeDiff);
    assert.ok(prompt.includes('diff truncated for repair'));
    assert.ok(!prompt.includes(hugeDiff));
  });

  it('should omit the diff section when diff is empty', () => {
    const prompt = buildRepairPrompt('feat: add login', 'format', '   ');
    assert.ok(!prompt.includes('Git diff context'));
  });
});

describe('buildProviderEndpoint', () => {
  it('should append /chat/completions to base URL', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://api.openai.com/v1', 'OpenAI'),
      'https://api.openai.com/v1/chat/completions'
    );
  });

  it('should strip trailing slashes before appending', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://api.openai.com/v1/', 'OpenAI'),
      'https://api.openai.com/v1/chat/completions'
    );
  });

  it('should strip multiple trailing slashes', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://api.openai.com/v1///', 'DeepSeek'),
      'https://api.openai.com/v1/chat/completions'
    );
  });

  it('should not double-append for Custom provider with full endpoint', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://my-server.com/v1/chat/completions', 'Custom'),
      'https://my-server.com/v1/chat/completions'
    );
  });

  it('should append for Custom provider without full endpoint', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://my-server.com/v1', 'Custom'),
      'https://my-server.com/v1/chat/completions'
    );
  });

  it('should support http protocol', () => {
    assert.strictEqual(
      buildProviderEndpoint('http://localhost:11434/v1', 'Custom'),
      'http://localhost:11434/v1/chat/completions'
    );
  });

  it('should throw on empty base URL', () => {
    assert.throws(
      () => buildProviderEndpoint('', 'OpenAI'),
      /Base URL is empty/
    );
  });

  it('should throw on whitespace-only base URL', () => {
    assert.throws(
      () => buildProviderEndpoint('   ', 'OpenAI'),
      /Base URL is empty/
    );
  });

  it('should throw on invalid URL', () => {
    assert.throws(
      () => buildProviderEndpoint('not-a-url', 'OpenAI'),
      /Invalid Base URL/
    );
  });

  it('should throw on unsupported protocol', () => {
    assert.throws(
      () => buildProviderEndpoint('ftp://example.com/v1', 'OpenAI'),
      /Unsupported URL protocol/
    );
  });

  it('should handle DeepSeek provider', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://api.deepseek.com', 'DeepSeek'),
      'https://api.deepseek.com/chat/completions'
    );
  });

  it('should handle MiMo provider', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://api.xiaomimimo.com/v1', 'MiMo'),
      'https://api.xiaomimimo.com/v1/chat/completions'
    );
  });

  it('should handle Z.AI provider', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://api.z.ai/api/paas/v4', 'Z.AI'),
      'https://api.z.ai/api/paas/v4/chat/completions'
    );
  });

  it('should handle NVIDIA NIM provider', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://integrate.api.nvidia.com/v1', 'NVIDIA NIM'),
      'https://integrate.api.nvidia.com/v1/chat/completions'
    );
  });

  it('should use the native Gemini Interactions endpoint', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://generativelanguage.googleapis.com/v1beta', 'Gemini'),
      'https://generativelanguage.googleapis.com/v1beta/interactions'
    );
  });

  it('should migrate the previous Gemini OpenAI-compatible base URL', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://generativelanguage.googleapis.com/v1beta/openai', 'Gemini'),
      'https://generativelanguage.googleapis.com/v1beta/interactions'
    );
  });

  it('should not double-append the Gemini interactions path', () => {
    assert.strictEqual(
      buildProviderEndpoint('https://generativelanguage.googleapis.com/v1beta/interactions', 'Gemini'),
      'https://generativelanguage.googleapis.com/v1beta/interactions'
    );
  });
});

describe('extractResponseContent', () => {
  it('should extract text from a Gemini interaction response', () => {
    const result = extractResponseContent({
      steps: [
        { type: 'thought', content: [{ type: 'text', text: 'hidden' }] },
        {
          type: 'model_output',
          content: [
            { type: 'text', text: 'feat(core): ' },
            { type: 'text', text: 'use Gemini interactions' },
          ],
        },
      ],
    }, 'Gemini');

    assert.strictEqual(result.content, 'feat(core): use Gemini interactions');
  });

  it('should preserve OpenAI-compatible response extraction', () => {
    const result = extractResponseContent({
      choices: [{ message: { content: 'fix: keep compatibility' } }],
    }, 'OpenAI');

    assert.strictEqual(result.content, 'fix: keep compatibility');
  });

  it('should accept alternate OpenAI-compatible non-streaming fields', () => {
    assert.strictEqual(
      extractResponseContent({ choices: [{ text: 'fix: choice text' }] }, 'Custom').content,
      'fix: choice text'
    );
    assert.strictEqual(
      extractResponseContent({ choices: [{ message: { text: 'fix: message text' } }] }, 'Custom').content,
      'fix: message text'
    );
    assert.strictEqual(
      extractResponseContent({ output_text: 'fix: top-level output' }, 'Custom').content,
      'fix: top-level output'
    );
  });
});

describe('Gemini Interactions API', () => {
  it('should send the native auth header and request schema', async () => {
    let requestHeaders: http.IncomingHttpHeaders = {};
    let requestBody = '';
    const server = http.createServer((request, response) => {
      requestHeaders = request.headers;
      request.on('data', (chunk: Buffer) => {
        requestBody += chunk.toString('utf8');
      });
      request.on('end', () => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          steps: [{
            type: 'model_output',
            content: [{ type: 'text', text: 'feat: use native Gemini' }],
          }],
        }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const result = await callLLM({
        provider: 'Gemini',
        endpoint: `http://127.0.0.1:${address.port}/v1beta/interactions`,
        apiKey: 'gemini-key',
        model: 'gemini-3.1-flash-lite',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
      });

      const parsedBody = JSON.parse(requestBody) as Record<string, unknown>;
      assert.strictEqual(result, 'feat: use native Gemini');
      assert.strictEqual(requestHeaders['x-goog-api-key'], 'gemini-key');
      assert.strictEqual(requestHeaders.authorization, undefined);
      assert.strictEqual(parsedBody.model, 'gemini-3.1-flash-lite');
      assert.strictEqual(parsedBody.system_instruction, 'Return a commit message.');
      assert.strictEqual(typeof parsedBody.input, 'string');
      assert.deepStrictEqual(parsedBody.generation_config, {
        thinking_level: 'minimal',
        temperature: 0.5,
        max_output_tokens: 512,
      });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should stream Gemini text deltas over SSE', async () => {
    let requestUrl = '';
    let requestBody = '';
    const server = http.createServer((request, response) => {
      requestUrl = request.url || '';
      request.on('data', (chunk: Buffer) => {
        requestBody += chunk.toString('utf8');
      });
      request.on('end', () => {
        response.writeHead(200, { 'Content-Type': 'text/event-stream' });
        response.write('event: step.delta\n');
        response.write('data: {"event_type":"step.delta","delta":{"type":"text","text":"fix: "}}\n\n');
        response.write('event: step.delta\n');
        response.write('data: {"event_type":"step.delta","delta":{"type":"text","text":"stream Gemini"}}\n\n');
        response.end();
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const chunks: string[] = [];
      const result = await callLLM({
        provider: 'Gemini',
        endpoint: `http://127.0.0.1:${address.port}/v1beta/interactions`,
        apiKey: 'gemini-key',
        model: 'gemini-3.1-flash-lite',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 1,
        onStream: (chunk) => chunks.push(chunk),
      });

      assert.strictEqual(result, 'fix: stream Gemini');
      assert.deepStrictEqual(chunks, ['fix: ', 'stream Gemini']);
      assert.strictEqual(requestUrl, '/v1beta/interactions?alt=sse');
      assert.strictEqual((JSON.parse(requestBody) as { stream?: boolean }).stream, true);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should not retry a non-transient 400 response', async () => {
    let requestCount = 0;
    const server = http.createServer((_request, response) => {
      requestCount += 1;
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end('{"error":"invalid request"}');
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      await assert.rejects(
        callLLM({
          provider: 'OpenAI',
          endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
          apiKey: 'test-key',
          model: 'test-model',
          systemPrompt: 'Return a commit message.',
          diff: 'diff --git a/a.ts b/a.ts',
          token: cancellationToken,
          timeoutMs: 1_000,
          temperature: 1,
        }),
        (error: unknown) => error instanceof RequestFailure && error.status === 400
      );
      assert.strictEqual(requestCount, 1);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should surface Retry-After on a 429 and retry with a delay', async () => {
    let requestCount = 0;
    let retryAfterSeen: string | string[] | undefined;
    const server = http.createServer((_request, response) => {
      requestCount += 1;
      if (requestCount === 1) {
        retryAfterSeen = '0'; // server-side value is read but delay is tiny for the test
        response.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '0' });
        response.end('{"error":"rate limited"}');
        return;
      }
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        choices: [{ message: { content: 'feat: recovered after retry' } }],
      }));
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const result = await callLLM({
        provider: 'OpenAI',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'test-key',
        model: 'test-model',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 5_000,
        temperature: 1,
      });
      assert.strictEqual(result, 'feat: recovered after retry');
      assert.strictEqual(requestCount, 2);
      assert.ok(retryAfterSeen !== undefined);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});

describe('Thinking-capable providers', () => {
  it('should disable thinking for GLM requests', async () => {
    let requestBody = '';
    const server = http.createServer((request, response) => {
      request.on('data', (chunk: Buffer) => {
        requestBody += chunk.toString('utf8');
      });
      request.on('end', () => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          choices: [{ message: { content: 'feat: disable thinking' } }],
        }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const result = await callLLM({
        provider: 'GLM',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'glm-key',
        model: 'glm-4.7-flashx',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
      });

      const parsedBody = JSON.parse(requestBody) as { thinking?: { type?: string } };
      assert.strictEqual(result, 'feat: disable thinking');
      assert.deepStrictEqual(parsedBody.thinking, { type: 'disabled' });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should stream GLM answer content when thinking is disabled', async () => {
    let requestBody = '';
    const server = http.createServer((request, response) => {
      request.on('data', (chunk: Buffer) => {
        requestBody += chunk.toString('utf8');
      });
      request.on('end', () => {
        response.writeHead(200, { 'Content-Type': 'text/event-stream' });
        response.write('data: {"choices":[{"delta":{"content":"feat: "}}]}\n\n');
        response.write('data: {"choices":[{"delta":{"content":"add hello.txt"}}]}\n\n');
        response.write('data: [DONE]\n\n');
        response.end();
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const chunks: string[] = [];
      const result = await callLLM({
        provider: 'GLM',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'glm-key',
        model: 'glm-4.7-flashx',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
        onStream: (chunk) => chunks.push(chunk),
      });

      const parsedBody = JSON.parse(requestBody) as { thinking?: { type?: string }; stream?: boolean };
      assert.strictEqual(result, 'feat: add hello.txt');
      assert.deepStrictEqual(chunks, ['feat: ', 'add hello.txt']);
      assert.deepStrictEqual(parsedBody.thinking, { type: 'disabled' });
      assert.strictEqual(parsedBody.stream, true);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should stream OpenAI-compatible delta text fields', async () => {
    const server = http.createServer((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      response.write('data: {"choices":[{"delta":{"text":"fix: "}}]}\n\n');
      response.write('data: {"choices":[{"delta":{"output_text":"accept alternate stream fields"}}]}\n\n');
      response.write('data: [DONE]\n\n');
      response.end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const chunks: string[] = [];
      const result = await callLLM({
        provider: 'Custom',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'custom-key',
        model: 'custom-model',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
        onStream: (chunk) => chunks.push(chunk),
      });

      assert.strictEqual(result, 'fix: accept alternate stream fields');
      assert.deepStrictEqual(chunks, ['fix: ', 'accept alternate stream fields']);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should process a final SSE data line without a trailing newline', async () => {
    const server = http.createServer((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      response.end('data: {"choices":[{"delta":{"content":"fix: parse final buffer"}}]}');
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const result = await callLLM({
        provider: 'OpenAI',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'test-key',
        model: 'test-model',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
        onStream: () => undefined,
      });

      assert.strictEqual(result, 'fix: parse final buffer');
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should fall back to non-streaming when a stream has no parsable content', async () => {
    let requestCount = 0;
    const requestBodies: Array<{ stream?: boolean }> = [];
    const server = http.createServer((request, response) => {
      let requestBody = '';
      request.on('data', (chunk: Buffer) => {
        requestBody += chunk.toString('utf8');
      });
      request.on('end', () => {
        requestCount += 1;
        requestBodies.push(JSON.parse(requestBody) as { stream?: boolean });

        if (requestCount === 1) {
          response.writeHead(200, { 'Content-Type': 'text/event-stream' });
          response.write('data: {"choices":[{"delta":{"reasoning_content":"thinking only"}}]}\n\n');
          response.write('data: [DONE]\n\n');
          response.end();
          return;
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          choices: [{ message: { content: 'fix: recover without streaming' } }],
        }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const result = await callLLM({
        provider: 'Custom',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'custom-key',
        model: 'custom-model',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
        onStream: () => undefined,
      });

      assert.strictEqual(result, 'fix: recover without streaming');
      assert.strictEqual(requestCount, 2);
      assert.strictEqual(requestBodies[0].stream, true);
      assert.strictEqual(requestBodies[1].stream, undefined);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should stream choice message content and top-level text fields', async () => {
    const server = http.createServer((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      response.write('data: {"choices":[{"message":{"content":"fix: "}}]}\n\n');
      response.write('data: {"choices":[{"text":"message "}]}\n\n');
      response.write('data: {"text":"and top-level"}\n\n');
      response.write('data: [DONE]\n\n');
      response.end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const chunks: string[] = [];
      const result = await callLLM({
        provider: 'Custom',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'custom-key',
        model: 'custom-model',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
        onStream: (chunk) => chunks.push(chunk),
      });

      assert.strictEqual(result, 'fix: message and top-level');
      assert.deepStrictEqual(chunks, ['fix: ', 'message ', 'and top-level']);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should omit unclosed think markup from streamed chunks', async () => {
    const server = http.createServer((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      response.write('data: {"choices":[{"delta":{"content":"<think>hidden"}}]}\n\n');
      response.write('data: {"choices":[{"delta":{"content":"</think>fix: visible"}}]}\n\n');
      response.write('data: [DONE]\n\n');
      response.end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const chunks: string[] = [];
      const result = await callLLM({
        provider: 'Custom',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'custom-key',
        model: 'custom-model',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 1_000,
        temperature: 0.5,
        onStream: (chunk) => chunks.push(chunk),
      });

      assert.strictEqual(result, 'fix: visible');
      assert.deepStrictEqual(chunks, ['fix: visible']);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should give the non-streaming fallback its own timeout budget', async () => {
    let requestCount = 0;
    const server = http.createServer((request, response) => {
      let requestBody = '';
      request.on('data', (chunk: Buffer) => {
        requestBody += chunk.toString('utf8');
      });
      request.on('end', () => {
        requestCount += 1;
        if (requestCount === 1) {
          response.writeHead(200, { 'Content-Type': 'text/event-stream' });
          // Consume part of the once-budget, then return an empty stream so the
          // fallback must start a fresh AbortController with the remaining time.
          setTimeout(() => {
            response.write('data: {"choices":[{"delta":{"reasoning_content":"slow think"}}]}\n\n');
            response.write('data: [DONE]\n\n');
            response.end();
          }, 120);
          return;
        }

        setTimeout(() => {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({
            output_text: 'fix: fallback with remaining timeout',
          }));
        }, 80);
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const result = await callLLM({
        provider: 'Custom',
        endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
        apiKey: 'custom-key',
        model: 'custom-model',
        systemPrompt: 'Return a commit message.',
        diff: 'diff --git a/a.ts b/a.ts',
        token: cancellationToken,
        timeoutMs: 400,
        temperature: 0.5,
        onStream: () => undefined,
      });

      assert.strictEqual(result, 'fix: fallback with remaining timeout');
      assert.strictEqual(requestCount, 2);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it('should not fall back when the streaming request times out', async () => {
    let requestCount = 0;
    const server = http.createServer((_request, response) => {
      requestCount += 1;
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      // Never end the stream; the client timeout should abort it.
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      await assert.rejects(
        () => callLLM({
          provider: 'Custom',
          endpoint: `http://127.0.0.1:${address.port}/chat/completions`,
          apiKey: 'custom-key',
          model: 'custom-model',
          systemPrompt: 'Return a commit message.',
          diff: 'diff --git a/a.ts b/a.ts',
          token: cancellationToken,
          timeoutMs: 80,
          temperature: 0.5,
          onStream: () => undefined,
        }),
        (error: unknown) => error instanceof RequestFailure && error.code === 'timeout'
      );
      assert.strictEqual(requestCount, 1);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
