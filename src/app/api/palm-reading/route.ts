import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEYがVercelの環境変数に設定されていません。" },
      { status: 500 }
    );
  }

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "画像データがありません。" }, { status: 400 });
    }

    // data:image/jpeg;base64,xxxxx の形式からmediaTypeとbase64本体を分離
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "画像形式が正しくありません。" }, { status: 400 });
    }
    const [, mediaType, base64Data] = match;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64Data },
              },
              {
                type: "text",
                text: "この手のひらの写真を見て、占いエンターテインメントとして手相占いをしてください。生命線・感情線・頭脳線・運命線などが写っていればそれらに触れつつ、前向きで温かいトーンで日本語で300字程度にまとめてください。医学的な診断や断定的な予言は避け、あくまで娯楽としての占いであることが伝わる表現にしてください。",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Claude APIの呼び出しに失敗しました。");
    }

    const data = await response.json();
    const resultText = data.content?.[0]?.text || "占い結果を取得できませんでした。";

    return NextResponse.json({ result: resultText });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "占いに失敗しました。" },
      { status: 500 }
    );
  }
}
