// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.
// Ensure this module's runtime side-effects are explicit and preserved by bundlers.
// Keep logic minimal and idempotent.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (!(globalThis as { __ERROR_CAPTURE_INITIALIZED?: boolean }).__ERROR_CAPTURE_INITIALIZED) {
  (globalThis as { __ERROR_CAPTURE_INITIALIZED?: boolean }).__ERROR_CAPTURE_INITIALIZED = true;

  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
    globalThis.addEventListener("unhandledrejection", (event) =>
      record((event as PromiseRejectionEvent).reason),
    );
  }
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}

// Named export so bundlers see a real module shape (helps some toolchains)
export const __error_capture_marker = true;
