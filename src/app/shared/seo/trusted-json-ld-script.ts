/**
 * CSP allows only named Trusted Types policies. `require-trusted-types-for
 * 'script'` treats HTMLScriptElement.textContent as a sink even for
 * `application/ld+json` data blocks, so JSON-LD must go through a policy.
 *
 * The policy name `json-ld` is allowlisted in `buildContentSecurityPolicy`.
 * createScript only accepts strings that parse as JSON — never free-form JS.
 */

type TrustedScriptLike = { toString(): string };

type JsonLdScriptPolicy = {
  createScript(input: string): TrustedScriptLike;
};

let cachedPolicy: JsonLdScriptPolicy | null | undefined;

type TrustedTypesWindow = Window & {
  trustedTypes?: {
    createPolicy(name: string, rules: { createScript: (input: string) => string }): JsonLdScriptPolicy;
  };
};

function resolvePolicy(doc: Document): JsonLdScriptPolicy | null {
  if (cachedPolicy !== undefined) return cachedPolicy;

  const win = doc.defaultView as TrustedTypesWindow | null;
  if (!win?.trustedTypes?.createPolicy) {
    cachedPolicy = null;
    return null;
  }

  try {
    cachedPolicy = win.trustedTypes.createPolicy('json-ld', {
      createScript(input: string) {
        JSON.parse(input);
        return input;
      },
    });
  } catch {
    // Policy already created (HMR) or creation blocked — fall back to string.
    cachedPolicy = null;
  }

  return cachedPolicy;
}

/** Value safe to assign to a JSON-LD <script> under Trusted Types. */
export function trustedJsonLdScript(doc: Document, json: string): string | TrustedScriptLike {
  const policy = resolvePolicy(doc);
  return policy ? policy.createScript(json) : json;
}

/** Test helper: drop the cached policy between cases. */
export function resetTrustedJsonLdPolicyForTests(): void {
  cachedPolicy = undefined;
}
