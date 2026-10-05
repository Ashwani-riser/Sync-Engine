"use client";

import { useState } from "react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (credential: string) => {
    setLoading(true);
    setMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        setMessage("API URL is not configured");
        return;
      }

      const response = await fetch(
        `${apiUrl}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Google login failed");
        return;
      }

      setMessage("Google login successful!");

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Google login error:", error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4">

      {/* Background glow */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo / Brand */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-xl shadow-blue-600/30">
            <span className="text-3xl font-extrabold text-white">
              C
            </span>
          </div>

          <h1 className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            CollabFlow
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Real-time collaborative workspace
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">

          {/* Card heading */}
          <div className="text-center">

            <h2 className="text-2xl font-semibold text-white">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to continue to your workspace
            </p>

          </div>

          {/* Google Login */}
          <div className="mt-8 flex justify-center">
            <GoogleSignInButton
              onSuccess={handleGoogleLogin}
              onError={() =>
                setMessage("Google authentication failed")
              }
            />
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">

              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />

              <span>
                Signing you in...
              </span>

            </div>
          )}

          {/* Message */}
          {message && (
            <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center text-sm text-blue-200">
              {message}
            </div>
          )}

          {/* Security text */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">

            <svg
              className="h-4 w-4 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v1h8z"
              />
            </svg>

            Secure authentication with Google

          </div>

        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-slate-600">
          Secure real-time collaboration powered by{" "}
          <span className="text-slate-500">
            CollabFlow
          </span>
        </p>

      </div>
    </main>
  );
}