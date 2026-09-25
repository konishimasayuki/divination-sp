"use client";

import { useApp, useGuard } from "./store";

export function useProviderMe() {
  const ok = useGuard("provider");
  const app = useApp();
  const me = app.providers.find((p) => p.id === app.session?.providerId) ?? null;
  return { ok, me, app };
}
