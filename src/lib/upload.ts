"use client";

// 写真を縮小してサーバーに保存し、表示用のURLを返す(保存できない環境ではそのまま画像データを返す)
export async function fileToDataURL(file: File, { max = 900, square = false } = {}): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  if (square) {
    const s = Math.min(img.width, img.height);
    const size = Math.min(max, s);
    c.width = size;
    c.height = size;
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  } else {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    ctx.drawImage(img, 0, 0, c.width, c.height);
  }
  URL.revokeObjectURL(url);
  return c.toDataURL("image/jpeg", 0.82);
}

export async function uploadImage(file: File, opts: { max?: number; square?: boolean } = {}): Promise<string> {
  const data = await fileToDataURL(file, opts);
  try {
    const res = await fetch("/api/img", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
    if (!res.ok) throw new Error();
    return (await res.json()).url as string;
  } catch {
    return data;
  }
}
