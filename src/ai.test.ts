import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIError, generate } from './ai.js';
import { fields, makeItems, Package } from './core.js';

const packageData = Object.fromEntries(fields.map(field => [
  field,
  field === 'features' ? ['Add exports'] : field === 'qa_summary' ? ['Export tests passed'] : ['item'],
])) as Package;

const validResponse = (featureId: string) => ({
  classification: [],
  statements: [{ audience: 'technical', kind: 'summary', text: 'Export support is available.', cites: [featureId] }],
});

describe('AI drafts', () => {
  afterEach(() => {
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_URL;
    delete process.env.AI_MODEL;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates validated mock statements', async () => {
    const result = await generate(makeItems(packageData), packageData);
    expect(result.mode).toBe('mock');
    expect(result.statements.length).toBeGreaterThan(0);
    expect(result.statements.every(statement => statement.kind === 'missing_info' || statement.cites.length > 0)).toBe(true);
  });

  it('drops invalid citations and prohibited approval claims', async () => {
    process.env.AI_API_KEY = 'fake';
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          classification: [{ id: 'BAD', impact: 'high', reason: 'x' }],
          statements: [
            { audience: 'technical', kind: 'summary', text: 'This release is approved', cites: ['BAD'] },
            { audience: 'technical', kind: 'summary', text: 'Valid', cites: ['F1'] },
          ],
        }) } }],
      }),
    })));

    const result = await generate(makeItems(packageData), packageData);
    expect(result.statements).toHaveLength(1);
    expect(result.classification).toHaveLength(0);
    expect(result.validationErrors).toHaveLength(2);
  });

  it('sends only model and messages, and parses JSON inside markdown fences', async () => {
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_API_URL = 'https://example.test/chat/completions';
    process.env.AI_MODEL = 'test-model';
    const items = makeItems(packageData);
    const featureId = items.find(item => item.field === 'features')!.id;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(validResponse(featureId))}\n\`\`\`` } }],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await generate(items, packageData);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);

    expect(Object.keys(requestBody).sort()).toEqual(['messages', 'model']);
    expect(requestBody.model).toBe('test-model');
    expect(requestBody.messages).toHaveLength(2);
    expect(result.statements).toHaveLength(1);
    expect(result.statements[0].text).toBe('Export support is available.');
  });

  it('logs provider status and a truncated body with the API key redacted', async () => {
    const apiKey = 'secret-test-key';
    process.env.AI_API_KEY = apiKey;
    const providerBody = JSON.stringify({ error: { message: `Bad request: ${apiKey} ${'x'.repeat(600)}` } });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => providerBody,
    })));

    await expect(generate(makeItems(packageData), packageData)).rejects.toBeInstanceOf(AIError);

    const log = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(log.event).toBe('ai_call_failed');
    expect(log.status).toBe(400);
    expect(log.body.length).toBeLessThanOrEqual(500);
    expect(log.body).toContain('[redacted]');
    expect(log.body).not.toContain(apiKey);
  });

  it('returns AIError for provider failure', async () => {
    process.env.AI_API_KEY = 'fake';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, text: async () => '' })));
    await expect(generate(makeItems(packageData), packageData)).rejects.toBeInstanceOf(AIError);
  });
});
