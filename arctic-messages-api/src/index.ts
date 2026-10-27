interface Env {
  MESSAGES_DB: D1Database;
  AUTH_DB: D1Database;
  MESSAGING_TOKEN_SECRET: string;
}

type Account = {
  arctic_id: string;
  nickname: string;
  status: string;
};

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  client_message_id: string;
  ciphertext: string;
  created_at: number;
};

function json(
  data: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json; charset=utf-8");
  h.set("Cache-Control", "no-store");
  h.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { status, headers: h });
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function authenticatedId(
  request: Request,
  env: Env,
): Promise<string | null> {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer ([A-Za-z0-9._-]+)$/);
  if (!match) return null;

  try {
    const parts = match[1].split(".");
    if (parts.length !== 2) return null;

    const [payloadPart, signaturePart] = parts;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.MESSAGING_TOKEN_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64url(signaturePart),
      new TextEncoder().encode(payloadPart),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64url(payloadPart)),
    ) as { sub?: unknown; exp?: unknown };

    if (typeof payload.sub !== "string" ||
        !/^\d{8}$/.test(payload.sub)) return null;

    if (typeof payload.exp !== "number" ||
        payload.exp <= Math.floor(Date.now() / 1000)) return null;

    return payload.sub;
  } catch {
    return null;
  }
}

async function activeAccount(
  env: Env,
  id: string,
): Promise<Account | null> {
  return env.AUTH_DB.prepare(`
    SELECT arctic_id, nickname, status
    FROM accounts
    WHERE arctic_id = ? AND status = 'active'
    LIMIT 1
  `).bind(id).first<Account>();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "GET" && path === "/api/health") {
      return json({ ok: true, service: "arctic-messages-api" });
    }

    const routes: Record<string, string> = {
      "/api/accounts/exists": "GET",
      "/api/messages": "GET",
      "/api/messages/send": "POST",
    };

    if (!(path in routes)) return json({ error: "Not found" }, 404);

    if (routes[path] !== method) {
      return json({ error: "Method not allowed" }, 405, {
        Allow: routes[path],
      });
    }

    try {
      const senderId = await authenticatedId(request, env);
      if (!senderId) {
        return json({ error: "Not authenticated" }, 401);
      }

      const sender = await activeAccount(env, senderId);
      if (!sender) return json({ error: "Account inactive" }, 401);

      // Check whether an active Arctic ID exists.
      if (path === "/api/accounts/exists") {
        const id = url.searchParams.get("id") || "";

        if (!/^\d{8}$/.test(id)) {
          return json({
            error: "Enter a valid 8-digit Arctic ID",
          }, 400);
        }

        const recipient = await activeAccount(env, id);

        if (!recipient) return json({ exists: false });

        return json({
          exists: true,
          arcticId: recipient.arctic_id,
          nickname: recipient.nickname,
        });
      }

      // Store a message for another active account.
      if (path === "/api/messages/send") {
        const body = await request.json() as {
          recipientId?: unknown;
          clientMessageId?: unknown;
          ciphertext?: unknown;
        };

        if (typeof body.recipientId !== "string" ||
            !/^\d{8}$/.test(body.recipientId)) {
          return json({ error: "Invalid recipient Arctic ID" }, 400);
        }

        if (body.recipientId === senderId) {
          return json({
            error: "You cannot message yourself",
          }, 400);
        }

        if (typeof body.clientMessageId !== "string" ||
            !/^[A-Za-z0-9_-]{8,100}$/.test(body.clientMessageId)) {
          return json({ error: "Invalid client message ID" }, 400);
        }

        if (typeof body.ciphertext !== "string" ||
            body.ciphertext.length < 1 ||
            body.ciphertext.length > 16000) {
          return json({ error: "Invalid message content" }, 400);
        }

        const recipient = await activeAccount(env, body.recipientId);
        if (!recipient) {
          return json({ error: "Arctic ID not found" }, 404);
        }

        const duplicate = await env.MESSAGES_DB.prepare(`
          SELECT id, recipient_id, created_at
          FROM messages
          WHERE sender_id = ? AND client_message_id = ?
          LIMIT 1
        `).bind(senderId, body.clientMessageId).first<{
          id: string;
          recipient_id: string;
          created_at: number;
        }>();

        if (duplicate) {
          if (duplicate.recipient_id !== body.recipientId) {
            return json({
              error: "Message ID already used",
            }, 409);
          }

          return json({
            ok: true,
            messageId: duplicate.id,
            createdAt: duplicate.created_at,
            duplicate: true,
          });
        }

        const id = crypto.randomUUID();
        const createdAt = Math.floor(Date.now() / 1000);

        await env.MESSAGES_DB.prepare(`
          INSERT INTO messages
            (id, sender_id, recipient_id, client_message_id,
             ciphertext, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          senderId,
          body.recipientId,
          body.clientMessageId,
          body.ciphertext,
          createdAt,
        ).run();

        return json({
          ok: true,
          messageId: id,
          createdAt,
        }, 201);
      }

      // Retrieve the conversation between the signed-in user and a peer.
      if (path === "/api/messages") {
        const peerId = url.searchParams.get("with") || "";

        if (!/^\d{8}$/.test(peerId) || peerId === senderId) {
          return json({ error: "Invalid recipient Arctic ID" }, 400);
        }

        const peer = await activeAccount(env, peerId);
        if (!peer) return json({ error: "Arctic ID not found" }, 404);

        const result = await env.MESSAGES_DB.prepare(`
          SELECT id, sender_id, recipient_id, client_message_id,
                 ciphertext, created_at
          FROM messages
          WHERE (sender_id = ? AND recipient_id = ?)
             OR (sender_id = ? AND recipient_id = ?)
          ORDER BY created_at DESC, id DESC
          LIMIT 100
        `).bind(senderId, peerId, peerId, senderId).all<MessageRow>();

        return json({
          messages: (result.results || []).reverse(),
        });
      }

      return json({ error: "Not found" }, 404);
    } catch {
      return json({
        error: "Request could not be completed",
      }, 500);
    }
  },
};
  
