export async function idempotentFetch(
  input: RequestInfo | URL,
  init: RequestInit & { idempotencyKey: string }
): Promise<Response> {
  const { idempotencyKey, ...rest } = init;

  const headers = new Headers(rest.headers);
  headers.set("Idempotency-Key", idempotencyKey);

  return fetch(input, {
    ...rest,
    headers,
  });
}

