"use client";

import { useApp, useGuard } from "@/lib/store";
import { NotificationSettings } from "@/components/NotificationSettings";
import { BackHeader, Loading, Screen } from "@/components/ui";

export default function UserSettings() {
  const ok = useGuard("user");
  const { user } = useApp();
  if (!ok || !user) return <Screen><Loading /></Screen>;
  return (
    <Screen>
      <BackHeader title="通知設定" href="/mypage" />
      <div className="px-4 pb-8">
        <NotificationSettings ownerType="user" ownerId={user.id} />
      </div>
    </Screen>
  );
}
