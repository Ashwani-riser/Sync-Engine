"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Normal email/password login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      setMessage("Login successful!");

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async (credential: string) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
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
      console.error(error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <span className="text-2xl font-bold text-white">
              C
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white">
            CollabFlow
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Real-time collaborative workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl">

          <h2 className="text-xl font-semibold text-white">
            Welcome back
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Sign in to continue to your workspace
          </p>

          {/* Google Login */}
          <div className="mt-7">
            <GoogleSignInButton
              onSuccess={handleGoogleLogin}
              onError={() =>
                setMessage("Google authentication failed")
              }
            />
          </div>

          {/* OR */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />

            <span className="text-xs font-medium text-slate-500">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Email Login */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Sign in"}
            </button>

          </form>

          {/* Message */}
          {message && (
            <div className="mt-5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center text-sm text-slate-300">
              {message}
            </div>
          )}

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Create account
            </Link>
          </p>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Secure real-time collaboration powered by CollabFlow
        </p>

      </div>
    </main>
  );
}