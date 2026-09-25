import { NextRequest, NextResponse } from "next/server";

// AI占い師のメッセージ返信(Claude API)
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEYが設定されていません。" }, { status: 500 });
  }
  try {
    const { persona, profile, history } = (await req.json()) as {
      persona: { name: string; tag: string; bio: string };
      profile: { name: string; birthday?: string; zodiac?: string; bloodType?: string };
      history: { from: string; text: string }[];
    };
    const messages = history
      .filter((m) => m.from !== "system")
      .slice(-12)
      .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "返信するメッセージがありません。" }, { status: 400 });
    }
    // 先頭はuserである必要がある
    while (messages.length && messages[0].role !== "user") messages.shift();

    const system = `あなたはオンライン占いサービス「杉の泉」のAI占い師「${persona.name}」です。得意分野: ${persona.tag}。紹介文: ${persona.bio}
相談者: ${profile.name}さん(生年月日 ${profile.birthday || "不明"}、${profile.zodiac || ""}、血液型 ${profile.bloodType || "不明"})。
・日本語で、やさしく前向きなトーンで200字前後で答えてください。
・占いはエンターテインメントです。医療・法律・投資の断定的な助言や、人の生死・妊娠の有無に関する鑑定はせず、専門家への相談をすすめてください。
・必要なら短い質問を一つ返して、会話を続けてください。`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 600, system, messages }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || "Claude APIの呼び出しに失敗しました。");
    }
    const data = await res.json();
    return NextResponse.json({ reply: data.content?.[0]?.text || "" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "返信に失敗しました。" }, { status: 500 });
  }
}
