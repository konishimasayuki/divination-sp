"use client";

import { inputCls } from "./ui";
import { IClose } from "./icons";

// 生年月日・出生時間の入力欄。
// iPhoneのSafariは日付/時刻欄に独自の最小幅があり枠からはみ出すため、幅と見た目をこちらで固定する。
// 出生時間は任意なので、入れた後でも×で未入力に戻せる。
export function BirthFields({
  birthday,
  birthTime,
  onBirthday,
  onBirthTime,
  timeLabel = "出生時間(任意)",
}: {
  birthday: string;
  birthTime: string;
  onBirthday: (v: string) => void;
  onBirthTime: (v: string) => void;
  timeLabel?: string;
}) {
  const field = `${inputCls} birth-input block min-w-0 appearance-none [color-scheme:dark]`;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="bd" className="text-xs text-lav">生年月日</label>
        <div className="relative min-w-0">
          <input id="bd" type="date" value={birthday} onChange={(e) => onBirthday(e.target.value)} className={`${field} ${birthday ? "" : "text-transparent"}`} />
          {!birthday && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[15px] text-faint">年 / 月 / 日</span>}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor="bt" className="text-xs text-lav">{timeLabel}</label>
        <div className="relative min-w-0">
          <input id="bt" type="time" value={birthTime} onChange={(e) => onBirthTime(e.target.value)} className={`${field} pr-11 ${birthTime ? "" : "text-transparent"}`} />
          {!birthTime && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[15px] text-faint">わからない</span>}
          {birthTime && (
            <button
              type="button"
              onClick={() => onBirthTime("")}
              aria-label="出生時間を消す"
              className="absolute inset-y-0 right-1 flex w-10 items-center justify-center text-mute"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-deep">
                <IClose size={13} />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
