import React from "react";
export default function AuthApp() {
  const [arcticId, setArcticId] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
        background: "#f4f7fc",
        fontFamily: "Arial, sans-serif",
        color: "#17243a",
      }}
    >
      <section style={{ width: "100%", maxWidth: 390 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>
            Arctic Messenger
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Private messaging, on your terms.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            alert("Login is not connected to the authentication API yet.");
          }}
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 16,
            boxShadow: "0 8px 32px #17243a12",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 23 }}>Log in</h2>

          <label style={{ display: "block", marginBottom: 7 }}>
            Arctic ID
          </label>
          <input
            value={arcticId}
            onChange={(event) => setArcticId(event.target.value)}
            inputMode="numeric"
            autoComplete="username"
            required
            placeholder="Enter your Arctic ID"
            style={fieldStyle}
          />

          <label style={{ display: "block", margin: "18px 0 7px" }}>
            Password
          </label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            style={fieldStyle}
          />

          <button type="submit" style={buttonStyle}>
            Log in
          </button>

          <p style={{ textAlign: "center", marginBottom: 0 }}>
            New user?{" "}
            <a href="/sign-up/" style={{ color: "#1769e0" }}>
              Sign up
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 13,
  border: "1px solid #d6deea",
  borderRadius: 8,
  fontSize: 16,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  margin: "22px 0 16px",
  border: 0,
  borderRadius: 8,
  background: "#1769e0",
  color: "white",
  fontSize: 16,
  fontWeight: 600,
};
