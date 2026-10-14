/** Accept only internal app paths; never forward OAuth callbacks to external hosts. */
export function safeCallbackPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n\t]/.test(value)) {
    return "/dashboard";
  }
  try {
    const parsed = new URL(value, "http://local.invalid");
    if (parsed.origin !== "http://local.invalid" || parsed.search || parsed.hash || !parsed.pathname.startsWith("/invite/")) return "/dashboard";
    if (!/^\/invite\/[a-f0-9]{64}$/.test(parsed.pathname)) return "/dashboard";
    return parsed.pathname;
  } catch {
    return "/dashboard";
  }
}
