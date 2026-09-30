import type { BucketLike } from "./courseFiles";
import type { SqlValue } from "./model";

export interface D1Like {
  prepare(sql: string): {
    bind(...params: SqlValue[]): {
      first<T>(): Promise<T | null>;
      all<T>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
}

export interface AuthEnvironment {
  DB?: D1Like;
  COURSE_FILES?: BucketLike;
}

export async function getRuntime(): Promise<{ kind: "cloudflare"; env: AuthEnvironment } | { kind: "node" }> {
  try {
    const { env } = await import(/* webpackIgnore: true */ "cloudflare:workers");
    return { kind: "cloudflare", env };
  } catch (error) {
    // Node cannot load this built-in. A missing Cloudflare binding is NOT a reason
    // to silently switch databases; callers must fail closed in that environment.
    const code = (error as { code?: string }).code;
    if (code !== "ERR_UNSUPPORTED_ESM_URL_SCHEME" && code !== "ERR_UNKNOWN_BUILTIN_MODULE" && code !== "ERR_MODULE_NOT_FOUND") throw error;
    return { kind: "node" };
  }
}
