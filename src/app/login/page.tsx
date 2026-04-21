"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid password");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h1>Milanote Clone</h1>
        <p>Personal Workspace Login</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            placeholder="Enter personal password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>}
          <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
            Enter Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
