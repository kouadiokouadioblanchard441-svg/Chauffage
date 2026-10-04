import assert from "node:assert/strict";
import { test } from "node:test";
import { notifyTelegramBusinessEvent } from "./telegram-events";

test("business Telegram notifications send safe event summaries only in production", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalChatId = process.env.TELEGRAM_CHAT_ID;
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];

  process.env.NODE_ENV = "production";
  process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
  process.env.TELEGRAM_CHAT_ID = "test-chat-id";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      body: JSON.parse(String(init?.body || "{}")),
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  try {
    notifyTelegramBusinessEvent({
      kind: "product_purchase",
      userId: 42,
      itemName: "<VIP> & Plan",
      itemId: 17,
      amount: 350,
      country: "PH",
    });
    await new Promise<void>((resolve) => setImmediate(resolve));

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/sendMessage$/);
    assert.equal(calls[0].body.chat_id, "test-chat-id");
    const text = String(calls[0].body.text);
    assert.match(text, /Utilisateur ID : <code>42<\/code>/);
    assert.match(text, /&lt;VIP&gt; &amp; Plan/);
    assert.match(text, /350 PHP/);
    assert.doesNotMatch(text, /test-bot-token|test-chat-id|password|phone/i);

    process.env.NODE_ENV = "development";
    notifyTelegramBusinessEvent({ kind: "registration", userId: 43, country: "PH" });
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalBotToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = originalBotToken;
    if (originalChatId === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = originalChatId;
  }
});