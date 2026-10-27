
import { useState, type FormEvent, type CSSProperties } from "react";

const API_BASE = "https://arctic-messenger.arikfaraz.workers.dev";

type ApiResult = {
  error?: string;
  arcticId?: string;
  nickname?: string;
  setupToken?: string;
  status?: string;
};

export default function AuthApp() {
  const [signup, setSignup] = useState(
    window.location.pathname.startsWith("/sign-up")
  );
  const [nickname, setNickname] = useState("");
  const [arcticId, setArcticId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(path: string, body?: object): Promise<ApiResult> {
    const response = await fetch(`${API_BASE}/api/${path}`, {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json() as ApiResult;
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      if (signup) {
        if (password.length < 8 || password.length > 32) {
          throw new Error("Password must be 8–32 characters.");
        }

        const result = await request("signup", { nickname, password });

        if (!result.arcticId || !result.setupToken) {
          throw new Error("Incomplete response from the server.");
        }

        // This completes the current backend setup.
        // The recovery-kit step still needs to be implemented.
        await request("signup/complete", {
          setupToken: result.setupToken,
        });

        setArcticId(result.arcticId);
        setPassword("");
        setNickname("");
        setSignup(false);
        window.history.pushState({}, "", "/");
        setMessage(
          `Account created. Your Arctic ID is ${result.arcticId}. Save this ID and use it to log in.`
        );
      } else {
        const result = await request("login", { arcticId, password });
        // Keep the signed-in identity available to the messenger UI.
        // This is display information, not an encryption key or password.
        window.localStorage.setItem("arctic.accountId", result.arcticId || arcticId);
        window.localStorage.setItem("arctic.nickname", result.nickname || "Arctic user");
        setPassword("");
        window.location.assign("/");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Request failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const field: CSSProperties = {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 13,
    marginTop: 7,
    marginBottom: 18,
    border: "1px solid #d5dce7",
    borderRadius: 10,
    fontSize: 16,
  };

  const link = (toSignup: boolean) => {
    setSignup(toSignup);
    setMessage("");
    window.history.pushState({}, "", toSignup ? "/sign-up/" : "/");
  };

  return (
    <main style={{
      minHeight: "100vh",
      boxSizing: "border-box",
      display: "grid",
      placeItems: "center",
      padding: 20,
      background: "#f3f6fb",
      color: "#172033",
      fontFamily: "Arial, sans-serif",
    }}>
      <section style={{
        width: "100%",
        maxWidth: 400,
        boxSizing: "border-box",
        padding: 28,
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 12px 40px #14213d12",
      }}>
        <div style={{
          display: "grid",
          placeItems: "center",
          width: 52,
          height: 52,
          borderRadius: 15,
          background: "#1769e0",
          color: "#fff",
          fontSize: 27,
          fontWeight: 700,
          marginBottom: 20,
        }}>A</div>

        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          Arctic Messenger
        </h1>
        <p style={{ color: "#667085", marginBottom: 26 }}>
          {signup ? "Create your account" : "Welcome back. Please log in."}
        </p>

        <form onSubmit={submit}>
          {signup ? (
            <label>
              Nickname
              <input
                style={field}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                autoComplete="nickname"
                maxLength={32}
                required
                placeholder="Choose a nickname"
              />
            </label>
          ) : (
            <label>
              Arctic ID
              <input
                style={field}
                value={arcticId}
                onChange={e => setArcticId(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]{8}"
                maxLength={8}
                autoComplete="username"
                required
                placeholder="Your 8-digit Arctic ID"
              />
            </label>
          )}

          <label>
            Password
            <input
              style={field}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={signup ? 8 : 1}
              maxLength={32}
              autoComplete={signup ? "new-password" : "current-password"}
              required
              placeholder={signup ? "8–32 characters" : "Your password"}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              padding: 14,
              border: 0,
              borderRadius: 10,
              background: "#1769e0",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              opacity: busy ? 0.65 : 1,
            }}
          >
            {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
          </button>
        </form>

        {message && (
          <p role="status" style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 8,
            background: "#f0f5ff",
            overflowWrap: "anywhere",
          }}>{message}</p>
        )}

        <p style={{
          textAlign: "center",
          marginTop: 24,
          color: "#667085",
          fontSize: 14,
        }}>
          {signup ? "Already have an account? " : "New user? "}
          <a
            href={signup ? "/" : "/sign-up/"}
            onClick={e => {
              e.preventDefault();
              link(!signup);
            }}
            style={{ color: "#1769e0", fontWeight: 700 }}
          >
            {signup ? "Log in" : "Sign up"}
          </a>
        </p>
      </section>
    </main>
  );
              }
