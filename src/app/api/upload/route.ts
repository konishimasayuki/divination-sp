import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

// メッセージ添付(写真・動画・ファイル)をブラウザから直接 Vercel Blob へ送るためのトークン発行
// Vercel の Storage で Blob を作成すると BLOB_READ_WRITE_TOKEN が自動で設定される
const MAX_ATTACH_MB = 50;

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "添付ファイルの保存先が未設定です" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("messages/")) throw new Error("保存先が正しくありません");
        return {
          allowedContentTypes: [
            "image/*",
            "video/*",
            "audio/*",
            "application/pdf",
            "text/plain",
            "application/zip",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.*",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint",
          ],
          maximumSizeInBytes: MAX_ATTACH_MB * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "アップロードできませんでした" }, { status: 400 });
  }
}
