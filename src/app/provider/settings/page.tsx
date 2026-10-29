"use client";

import { useProviderMe } from "@/lib/useProviderMe";
import { NotificationSettings } from "@/components/NotificationSettings";
import { BackHeader, Loading, Screen } from "@/components/ui";

export default function ProviderSettings() {
  const { ok, me } = useProviderMe();
  if (!ok || !me) return <Screen><Loading /></Screen>;
  return (
    <Screen>
      <BackHeader title="通知設定" href="/provider" />
      <div className="px-4 pb-8">
        <NotificationSettings ownerType="provider" ownerId={me.id} />
      </div>
    </Screen>
  );
}
