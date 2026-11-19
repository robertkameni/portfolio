import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetTrustedJsonLdPolicyForTests, trustedJsonLdScript } from './trusted-json-ld-script';

describe('trustedJsonLdScript', () => {
  afterEach(() => {
    resetTrustedJsonLdPolicyForTests();
    vi.unstubAllGlobals();
  });

  it('returns the JSON string when Trusted Types are unavailable', () => {
    const doc = document.implementation.createHTMLDocument();
    Object.defineProperty(doc, 'defaultView', { value: null, configurable: true });
    expect(trustedJsonLdScript(doc, '{"a":1}')).toBe('{"a":1}');
  });

  it('creates a json-ld policy and returns createScript output', () => {
    const createScript = vi.fn((input: string) => `trusted:${input}`);
    const createPolicy = vi.fn(() => ({ createScript }));
    vi.stubGlobal('trustedTypes', { createPolicy });

    const doc = document.implementation.createHTMLDocument();
    Object.defineProperty(doc, 'defaultView', { value: window, configurable: true });

    const result = trustedJsonLdScript(doc, '{"@type":"Person"}');
    expect(createPolicy).toHaveBeenCalledWith('json-ld', expect.any(Object));
    expect(createScript).toHaveBeenCalledWith('{"@type":"Person"}');
    expect(result).toBe('trusted:{"@type":"Person"}');
  });

  it('rejects non-JSON inside the policy createScript rule', () => {
    let rule: { createScript: (input: string) => string } | undefined;
    vi.stubGlobal('trustedTypes', {
      createPolicy: (_name: string, rules: { createScript: (input: string) => string }) => {
        rule = rules;
        return { createScript: (input: string) => rules.createScript(input) };
      },
    });

    const doc = document.implementation.createHTMLDocument();
    Object.defineProperty(doc, 'defaultView', { value: window, configurable: true });
    trustedJsonLdScript(doc, '{}');

    expect(() => rule?.createScript('alert(1)')).toThrow();
    expect(rule?.createScript('{"ok":true}')).toBe('{"ok":true}');
  });
});
