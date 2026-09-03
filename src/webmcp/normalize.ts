export type ToolReturn = Record<string, unknown>;
export type ExecuteOptions = { signal?: AbortSignal };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}

export function parseArgs<T>(raw: unknown): T {
  let v: unknown = raw;
  if (typeof raw === 'string') {
    try {
      v = JSON.parse(raw);
    } catch {
      throw new Error('INVALID_ARGS');
    }
  }
  if (isPlainObject(v)) return v as T;
  throw new Error('INVALID_ARGS');
}

// identity on purpose: the only place to add an MCP-style envelope if Task 1 Step 8 shows ChatGPT needs it.
export function toolResult(payload: ToolReturn): ToolReturn {
  return payload;
}
