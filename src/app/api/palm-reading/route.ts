import { NextRequest, NextResponse } from "next/server";

// 手のひら画像をClaude APIで鑑定し、線ごとの結果をJSONで返す
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEYがVercelの環境変数に設定されていません。" }, { status: 500 });
  }
  try {
    const { image } = await req.json();
    const match = typeof image === "string" ? image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/) : null;
    if (!match) return NextResponse.json({ error: "画像形式が正しくありません。" }, { status: 400 });
    const [, mediaType, base64Data] = match;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 900,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
              {
                type: "text",
                text:
                  "この写真の手のひらを、占いエンターテインメントとして手相鑑定してください。前向きで温かい日本語で書き、医学的な診断や断定的な予言、人の生死に関わる内容は避けてください。" +
                  "手のひらがはっきり写っていない場合は isPalm を false にしてください。" +
                  "次のJSONだけを出力してください(前後に文章やコードブロックを付けない):" +
                  '{"isPalm":true,"keyword":"8〜14文字のキーワード(途中で改行したい位置に「、」)","summary":"全体の総評 80字程度","life":"生命線 50字程度","heart":"感情線 50字程度","head":"頭脳線 50字程度","fate":"運命線 50字程度"}',
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Claude APIの呼び出しに失敗しました。");
    }
    const data = await res.json();
    const raw: string = data.content?.[0]?.text || "";
    const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText);
    if (parsed.isPalm === false) {
      return NextResponse.json({ error: "手のひらがうまく読み取れませんでした。明るい場所で、手のひら全体が写るように撮影してください。" }, { status: 422 });
    }
    return NextResponse.json({ result: parsed });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "鑑定に失敗しました。" }, { status: 500 });
  }
}
