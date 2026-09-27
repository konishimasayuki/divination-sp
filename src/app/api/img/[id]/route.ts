import { NextRequest } from "next/server";
import { assertRedis, redis } from "@/lib/redis";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertRedis();
    const { id } = await ctx.params;
    const data = await redis.get<string>(`img:${id}`);
    const m = data?.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    if (!m) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(m[2], "base64"), {
      headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
