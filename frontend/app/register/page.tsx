"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // ================= NORMAL REGISTER =================

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setRegistered(false);

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }

      setRegistered(true);

      setMessage(
        "Account created successfully! Please check your email and verify your account before logging in."
      );

      // Clear form
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // ================= GOOGLE SIGN UP =================

  const handleGoogleRegister = async (
    credential: string
  ) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/google",
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
        setMessage(
          data.message || "Google registration failed"
        );
        return;
      }

      setMessage("Google account connected successfully!");

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center px-4 py-8">

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

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl">

          <h2 className="text-xl font-semibold text-white">
            Create your account
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Start collaborating with your team
          </p>

          {/* Google */}
          {!registered && (
            <div className="mt-7">

              <GoogleSignInButton
                onSuccess={handleGoogleRegister}
                onError={() =>
                  setMessage(
                    "Google authentication failed"
                  )
                }
              />

            </div>
          )}

          {/* OR */}
          {!registered && (
            <div className="my-6 flex items-center gap-3">

              <div className="h-px flex-1 bg-slate-700" />

              <span className="text-xs font-medium text-slate-500">
                OR
              </span>

              <div className="h-px flex-1 bg-slate-700" />

            </div>
          )}

          {/* Registration Form */}
          {!registered && (
            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

              {/* Name */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Your name"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

              </div>

              {/* Email */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
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
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>
          )}

          {/* Message */}
          {message && (
            <div
              className={`mt-5 rounded-lg border px-4 py-3 text-center text-sm ${
                registered
                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                  : "border-slate-700 bg-slate-800 text-slate-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* After registration */}
          {registered && (
            <div className="mt-6 text-center">

              <p className="text-sm text-slate-400">
                Check your inbox and click the
                <span className="font-medium text-white">
                  {" "}Verify Email{" "}
                </span>
                button.
              </p>

              <Link
                href="/"
                className="mt-5 inline-block w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-500"
              >
                Go to Login
              </Link>

            </div>
          )}

          {/* Login Link */}
          {!registered && (
            <p className="mt-6 text-center text-sm text-slate-400">

              Already have an account?{" "}

              <Link
                href="/"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in
              </Link>

            </p>
          )}

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Secure authentication powered by CollabFlow
        </p>

      </div>

    </main>
  );
}