import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { buildChatCompletionsEndpoint } from '../llm/provider';

describe('buildChatCompletionsEndpoint', () => {
  it('should append /chat/completions to base URL', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('https://api.openai.com/v1', 'OpenAI'),
      'https://api.openai.com/v1/chat/completions'
    );
  });

  it('should strip trailing slashes before appending', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('https://api.openai.com/v1/', 'OpenAI'),
      'https://api.openai.com/v1/chat/completions'
    );
  });

  it('should strip multiple trailing slashes', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('https://api.openai.com/v1///', 'DeepSeek'),
      'https://api.openai.com/v1/chat/completions'
    );
  });

  it('should not double-append for Custom provider with full endpoint', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('https://my-server.com/v1/chat/completions', 'Custom'),
      'https://my-server.com/v1/chat/completions'
    );
  });

  it('should append for Custom provider without full endpoint', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('https://my-server.com/v1', 'Custom'),
      'https://my-server.com/v1/chat/completions'
    );
  });

  it('should support http protocol', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('http://localhost:11434/v1', 'Custom'),
      'http://localhost:11434/v1/chat/completions'
    );
  });

  it('should throw on empty base URL', () => {
    assert.throws(
      () => buildChatCompletionsEndpoint('', 'OpenAI'),
      /Base URL is empty/
    );
  });

  it('should throw on whitespace-only base URL', () => {
    assert.throws(
      () => buildChatCompletionsEndpoint('   ', 'OpenAI'),
      /Base URL is empty/
    );
  });

  it('should throw on invalid URL', () => {
    assert.throws(
      () => buildChatCompletionsEndpoint('not-a-url', 'OpenAI'),
      /Invalid Base URL/
    );
  });

  it('should throw on unsupported protocol', () => {
    assert.throws(
      () => buildChatCompletionsEndpoint('ftp://example.com/v1', 'OpenAI'),
      /Unsupported URL protocol/
    );
  });

  it('should handle DeepSeek provider', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('https://api.deepseek.com', 'DeepSeek'),
      'https://api.deepseek.com/chat/completions'
    );
  });

  it('should handle Gemini provider', () => {
    assert.strictEqual(
      buildChatCompletionsEndpoint('https://generativelanguage.googleapis.com/v1beta/openai', 'Gemini'),
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    );
  });
});
