// サーバー専用(APIルートからのみ読み込む)
import crypto from "node:crypto";

// PayPay ウェブペイメント(Open Payment API)
// Vercelの環境変数:
//   PAYPAY_API_KEY / PAYPAY_API_SECRET / PAYPAY_MERCHANT_ID
//   PAYPAY_ENV = "production"(本番) / それ以外はサンドボックス
const env = process.env;
export const paypayConfigured = !!(env.PAYPAY_API_KEY && env.PAYPAY_API_SECRET && env.PAYPAY_MERCHANT_ID);
export const paypayProduction = env.PAYPAY_ENV === "production";
const BASE = paypayProduction ? "https://api.paypay.ne.jp" : "https://stg-api.sandbox.paypay.ne.jp";
const CONTENT_TYPE = "application/json;charset=UTF-8";

// PayPayのHMAC認証ヘッダ(hmac OPA-Auth)
function authHeader(method: string, path: string, body: string | null) {
  const epoch = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(4).toString("hex");
  let contentType = "empty";
  let hash = "empty";
  if (body) {
    contentType = CONTENT_TYPE;
    hash = crypto.createHash("md5").update(contentType).update(body).digest("base64");
  }
  const raw = [path, method, nonce, epoch, contentType, hash].join("\n");
  const mac = crypto.createHmac("sha256", env.PAYPAY_API_SECRET!).update(raw).digest("base64");
  return `hmac OPA-Auth:${[env.PAYPAY_API_KEY, mac, nonce, epoch, hash].join(":")}`;
}

type PayPayRes<T> = { resultInfo: { code: string; message: string }; data?: T };

async function call<T>(method: "GET" | "POST" | "DELETE", path: string, payload?: unknown): Promise<PayPayRes<T>> {
  if (!paypayConfigured) throw new Error("PayPayの環境変数が設定されていません");
  const body = payload ? JSON.stringify(payload) : null;
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: authHeader(method, path, body),
      "X-ASSUME-MERCHANT": env.PAYPAY_MERCHANT_ID!,
      ...(body ? { "Content-Type": CONTENT_TYPE } : {}),
    },
    body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as PayPayRes<T> | null;
  if (!json) throw new Error(`PayPay APIの応答を読み取れませんでした(${res.status})`);
  return json;
}

// 決済用のQRコード(支払いページURL)を作る
export async function createCode(p: { merchantPaymentId: string; amount: number; description: string; redirectUrl: string }) {
  const r = await call<{ url: string; deeplink: string; expiryDate: number }>("POST", "/v2/codes", {
    merchantPaymentId: p.merchantPaymentId,
    amount: { amount: p.amount, currency: "JPY" },
    codeType: "ORDER_QR",
    orderDescription: p.description,
    isAuthorization: false,
    redirectUrl: p.redirectUrl,
    redirectType: "WEB_LINK",
    requestedAt: Math.floor(Date.now() / 1000),
  });
  if (r.resultInfo.code !== "SUCCESS" || !r.data) throw new Error(`PayPay決済の作成に失敗しました(${r.resultInfo.code})`);
  return r.data;
}

export type PayPayStatus = "CREATED" | "COMPLETED" | "FAILED" | "CANCELED" | "EXPIRED" | "AUTHORIZED" | "REFUNDED" | string;

// 決済状況を問い合わせる(まだ支払われていなければ CREATED / 未作成扱い)
export async function getPayment(merchantPaymentId: string): Promise<{ status: PayPayStatus; amount?: number; paymentId?: string }> {
  const r = await call<{ status: string; amount?: { amount: number }; paymentId?: string }>(
    "GET",
    `/v2/codes/payments/${encodeURIComponent(merchantPaymentId)}`
  );
  if (r.resultInfo.code === "DYNAMIC_QR_PAYMENT_NOT_FOUND" || r.resultInfo.code === "NO_SUCH_PAYMENT") return { status: "CREATED" };
  if (r.resultInfo.code !== "SUCCESS" || !r.data) throw new Error(`PayPay決済の確認に失敗しました(${r.resultInfo.code})`);
  return { status: r.data.status, amount: r.data.amount?.amount, paymentId: r.data.paymentId };
}
