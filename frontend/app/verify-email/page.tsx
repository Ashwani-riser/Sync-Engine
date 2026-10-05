"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const verificationStarted = useRef(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setMessage("Verification token is missing.");
        setSuccess(false);
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          setMessage("API URL is not configured.");
          setSuccess(false);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${apiUrl}/api/auth/verify-email?token=${encodeURIComponent(
            token
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(
            data.message || "Email verification failed."
          );
          setSuccess(false);
          return;
        }

        setMessage(
          data.message || "Email verified successfully!"
        );

        setSuccess(true);
      } catch (error) {
        console.error("Email verification error:", error);

        setMessage("Unable to connect to server.");
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-8 text-center shadow-2xl">

          {/* Logo */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-2xl font-bold text-white">
              C
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white">
            CollabFlow
          </h1>

          {/* Loading */}
          {loading && (
            <>
              <p className="mt-6 text-slate-400">
                Verifying your email...
              </p>

              <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
            </>
          )}

          {/* Success */}
          {!loading && success && (
            <>
              <h2 className="mt-6 text-xl font-semibold text-green-400">
                Email Verified!
              </h2>

              <p className="mt-3 text-sm text-slate-400">
                {message}
              </p>

              <Link
                href="/"
                className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500"
              >
                Go to Login
              </Link>
            </>
          )}

          {/* Failed */}
          {!loading && !success && (
            <>
              <h2 className="mt-6 text-xl font-semibold text-red-400">
                Verification Failed
              </h2>

              <p className="mt-3 text-sm text-slate-400">
                {message}
              </p>

              <Link
                href="/register"
                className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500"
              >
                Back to Register
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}