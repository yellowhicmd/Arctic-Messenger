interface Env {
  DB: D1Database;
  MESSAGES_DB: D1Database;
}

const PASSWORD_ITERATIONS = 600_000;
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const SETUP_SECONDS = 15 * 60;

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const result = new Headers(headers);
  result.set("Content-Type", "application/json; charset=utf-8");
  result.set("Cache-Control", "no-store");
  result.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { status, headers: result });
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function encode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decode(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return encode(new Uint8Array(digest));
}

async function passwordHash(password: string, salt: Uint8Array): Promise<string> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const result = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PASSWORD_ITERATIONS,
    },
    material,
    256,
  );

  return encode(new Uint8Array(result));
}

function equal(a: string, b: string): boolean {
  try {
    const x = decode(a);
    const y = decode(b);
    if (x.length !== y.length) return false;

    let diff = 0;
    for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
    return diff === 0;
  } catch {
    return false;
  }
}

function sessionCookie(token: string, maxAge: number): string {
  return `arctic_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? match[1] : null;
}

async function newArcticId(db: D1Database): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const bytes = randomBytes(4);
    const number =
      10_000_000 +
      (new DataView(bytes.buffer).getUint32(0) % 90_000_000);
    const id = String(number);

    const existing = await db
      .prepare("SELECT arctic_id FROM accounts WHERE arctic_id = ?")
      .bind(id)
      .first();

    if (!existing) return id;
  }

  throw new Error("Could not allocate Arctic ID");
}

async function currentAccount(request: Request, env: Env) {
  const token = readCookie(request, "arctic_session");

  console.log(
    "[session-debug] cookiePresent:",
    Boolean(token),
    "tokenLength:",
    token?.length ?? 0,
  );

  if (!token) return null;

  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);

  const session = await env.DB.prepare(`
    SELECT s.expires_at, a.status
    FROM sessions AS s
    INNER JOIN accounts AS a ON a.arctic_id = s.arctic_id
    WHERE s.token_hash = ?
    LIMIT 1
  `)
    .bind(tokenHash)
    .first<{ expires_at: number; status: string }>();

  console.log(
    "[session-debug] hashMatch:",
    Boolean(session),
    "now:",
    now,
    "expiresAt:",
    session?.expires_at ?? null,
    "accountStatus:",
    session?.status ?? null,
  );

  if (!session || session.expires_at <= now || session.status !== "active") {
    return null;
  }

  return await env.DB.prepare(`
    SELECT a.arctic_id, a.nickname, a.status
    FROM sessions AS s
    INNER JOIN accounts AS a ON a.arctic_id = s.arctic_id
    WHERE s.token_hash = ?
      AND s.expires_at > ?
      AND a.status = 'active'
    LIMIT 1
  `)
    .bind(tokenHash, now)
    .first<{
      arctic_id: string;
      nickname: string;
      status: string;
    }>();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "GET" && path === "/api/health") {
      return json({ ok: true });
    }

    const allowedMethods: Record<string, string> = {
      "/api/signup": "POST",
      "/api/signup/complete": "POST",
      "/api/login": "POST",
      "/api/logout": "POST",
      "/api/me": "GET",
    };

    if (!(path in allowedMethods)) {
      return json({ error: "Not found" }, 404);
    }

    if (allowedMethods[path] !== method) {
      return json({ error: "Method not allowed" }, 405, {
        Allow: allowedMethods[path],
      });
    }

    // Same-origin requests are expected for the first local test.
    // Configure the real frontend origin before cross-origin browser use.
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin &&
        origin !== "http://localhost:5173" &&
        origin !== "http://127.0.0.1:5173") {
      return json({ error: "Origin not allowed" }, 403);
    }

    try {
      if (path === "/api/signup") {
        const body = await request.json() as {
          nickname?: unknown;
          password?: unknown;
        };

        if (typeof body.nickname !== "string" ||
            typeof body.password !== "string") {
          return json({ error: "Nickname and password are required" }, 400);
        }

        const nickname = body.nickname.trim();
        const password = body.password;

        if (!nickname || nickname.length > 32 ||
            password.length < 8 || password.length > 32) {
          return json({
            error: "Nickname must be 1–32 characters and password 8–32 characters",
          }, 400);
        }

        const salt = randomBytes(16);
        const hash = await passwordHash(password, salt);
        const id = await newArcticId(env.DB);
        const setupToken = encode(randomBytes(32));
        const setupHash = await sha256(setupToken);
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(`
          INSERT INTO accounts
            (arctic_id, nickname, password_salt, password_hash,
             status, setup_token_hash, created_at)
          VALUES (?, ?, ?, ?, 'pending', ?, ?)
        `).bind(
          id, nickname, encode(salt), hash, setupHash, now,
        ).run();

        return json({
          arcticId: id,
          status: "pending",
          setupToken,
          setupExpiresInSeconds: SETUP_SECONDS,
          nextStep: "complete_setup",
        }, 201);
      }

      if (path === "/api/signup/complete") {
        const body = await request.json() as { setupToken?: unknown };
        if (typeof body.setupToken !== "string" ||
            body.setupToken.length < 20) {
          return json({ error: "Valid setup token required" }, 400);
        }

        const setupHash = await sha256(body.setupToken);
        const cutoff = Math.floor(Date.now() / 1000) - SETUP_SECONDS;

        const result = await env.DB.prepare(`
          UPDATE accounts
          SET status = 'active', setup_token_hash = NULL
          WHERE setup_token_hash = ?
            AND status = 'pending'
            AND created_at >= ?
        `).bind(setupHash, cutoff).run();

        if (!result.success || result.meta.changes !== 1) {
          return json({
            error: "Setup token is invalid, expired, or already used",
          }, 400);
        }

        return json({ status: "active" });
      }

      if (path === "/api/login") {
        const body = await request.json() as {
          arcticId?: unknown;
          password?: unknown;
        };

        if (typeof body.arcticId !== "string" ||
            !/^\d{8}$/.test(body.arcticId) ||
            typeof body.password !== "string" ||
            body.password.length < 1 || body.password.length > 32) {
          return json({ error: "Invalid credentials" }, 400);
        }

        const account = await env.DB.prepare(`
          SELECT arctic_id, nickname, password_salt, password_hash, status
          FROM accounts WHERE arctic_id = ?
        `).bind(body.arcticId).first<{
          arctic_id: string;
          nickname: string;
          password_salt: string;
          password_hash: string;
          status: string;
        }>();

        if (!account) {
          return json({ error: "Invalid credentials" }, 401);
        }

        const actual = await passwordHash(
          body.password, decode(account.password_salt),
        );

        if (!equal(actual, account.password_hash)) {
          return json({ error: "Invalid credentials" }, 401);
        }

        if (account.status !== "active") {
          return json({ error: "Account setup is not complete" }, 403);
        }

        const token = encode(randomBytes(32));
        const tokenHash = await sha256(token);
        const now = Math.floor(Date.now() / 1000);

                await env.DB.prepare(`
          INSERT INTO sessions (token_hash, arctic_id, expires_at, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(
          tokenHash,
          account.arctic_id,
          now + SESSION_SECONDS,
          now,
        ).run();

        return json({
          arcticId: account.arctic_id,
          nickname: account.nickname,
        }, 200, {
          "Set-Cookie": sessionCookie(token, SESSION_SECONDS),
        });
      }

      if (path === "/api/me") {
        const account = await currentAccount(request, env);
        if (!account) {
          return json({ error: "Not authenticated" }, 401, {
            "Set-Cookie": sessionCookie("", 0),
          });
        }

        return json({
          arcticId: account.arctic_id,
          nickname: account.nickname,
        });
      }

      if (path === "/api/logout") {
        const token = readCookie(request, "arctic_session");
        if (token) {
          await env.DB.prepare(
            "DELETE FROM sessions WHERE token_hash = ?",
          ).bind(await sha256(token)).run();
        }

        return json({ ok: true }, 200, {
          "Set-Cookie": sessionCookie("", 0),
        });
      }

      return json({ error: "Not found" }, 404);
    } catch {
      return json({ error: "Request could not be completed" }, 500);
    }
  },
};
