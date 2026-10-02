"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DocumentItem {
  _id: string;
  title: string;
  owner?: string;
  updatedAt: string;
  createdAt?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  // =========================
  // LOAD DASHBOARD
  // =========================

  const loadDashboard = async () => {
    try {
      const userResponse = await fetch(
        "http://localhost:8000/api/auth/me",
        {
          credentials: "include",
        }
      );

      if (!userResponse.ok) {
        router.push("/");
        return;
      }

      const userData = await userResponse.json();

      setUser(userData.user);

      const documentsResponse = await fetch(
        "http://localhost:8000/api/documents",
        {
          credentials: "include",
        }
      );

      if (!documentsResponse.ok) {
        setMessage("Failed to load documents");
        return;
      }

      const documentsData = await documentsResponse.json();

      setDocuments(documentsData.documents || []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // =========================
  // SEARCH
  // =========================

  const filteredDocuments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return documents;
    }

    return documents.filter((document) =>
      document.title.toLowerCase().includes(value)
    );
  }, [documents, search]);

  // =========================
  // CREATE DOCUMENT
  // =========================

  const handleCreateDocument = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage("Please enter a document title");
      return;
    }

    setCreating(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: title.trim(),
            content: "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to create document");
        return;
      }

      const newDocument = data.document;

      setTitle("");
      setShowCreate(false);

      router.push(`/document/${newDocument._id}`);
    } catch (error) {
      console.error(error);
      setMessage("Unable to create document");
    } finally {
      setCreating(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    router.push("/");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <span className="font-bold text-white">C</span>
          </div>

          <p className="text-sm text-slate-400">
            Loading CollabFlow...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-[1650px] items-center justify-between px-8">

          {/* BRAND */}

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <span className="text-lg font-bold text-white">
                C
              </span>
            </div>

            <div className="leading-none">
              <h1 className="text-[18px] font-bold tracking-tight text-white">
                Collab<span className="text-blue-500">Flow</span>
              </h1>

              <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                Real-time workspace
              </p>
            </div>
          </Link>

          {/* USER */}

          <div className="flex items-center gap-4">

            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-200">
                  {user.name}
                </p>

                <p className="text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
            )}

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/15 text-sm font-semibold text-blue-400 ring-1 ring-blue-500/10">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <button
              onClick={handleLogout}
              className="hidden rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white sm:block"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <section className="mx-auto max-w-[1650px] px-8 py-10">

        {/* =========================
            WELCOME
        ========================= */}

        <div className="mb-9">
          <p className="text-sm font-medium text-blue-400">
            Workspace
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Welcome back,{" "}
            {user?.name?.split(" ")[0] || "there"} 👋
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Create, edit and collaborate on documents in real time.
          </p>
        </div>

        {/* =========================
            STATS
        ========================= */}

        <div className="mb-9 grid gap-5 sm:grid-cols-3">

          {/* TOTAL DOCUMENTS */}

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
            <p className="text-sm font-medium text-slate-500">
              Total Documents
            </p>

            <p className="mt-3 text-3xl font-bold text-white">
              {documents.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Available in your workspace
            </p>
          </div>

          {/* WORKSPACE */}

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
            <p className="text-sm font-medium text-slate-500">
              Workspace
            </p>

            <p className="mt-3 text-2xl font-bold text-white">
              Personal
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Your collaborative workspace
            </p>
          </div>

          {/* COLLABORATION */}

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
            <p className="text-sm font-medium text-slate-500">
              Collaboration
            </p>

            <p className="mt-3 text-2xl font-bold text-blue-400">
              Real-time
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Powered by Socket.IO
            </p>
          </div>
        </div>

        {/* =========================
            DOCUMENT HEADER
        ========================= */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h3 className="text-xl font-semibold text-white">
              Your Documents
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Access and manage your recent collaborative work.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreate(true);
              setMessage("");
            }}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500"
          >
            + New Document
          </button>
        </div>

        {/* =========================
            SEARCH
        ========================= */}

        <div className="mb-7">
          <div className="relative w-full max-w-xl">

            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* =========================
            CREATE DOCUMENT
        ========================= */}

        {showCreate && (
          <div className="mb-7 rounded-xl border border-blue-500/20 bg-slate-900 p-6 shadow-xl">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h3 className="font-semibold text-white">
                  Create new document
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Give your document a name to get started.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreate(false);
                  setTitle("");
                  setMessage("");
                }}
                className="text-slate-500 transition hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateDocument}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project Documentation"
                autoFocus
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />

              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Document"}
              </button>
            </form>
          </div>
        )}

        {/* =========================
            MESSAGE
        ========================= */}

        {message && (
          <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            {message}
          </div>
        )}

        {/* =========================
            DOCUMENTS
        ========================= */}

        {filteredDocuments.length === 0 ? (

          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-20 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-xl">
              📄
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              {search
                ? "No documents found"
                : "No documents yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search
                ? "Try searching with a different document name."
                : "Create your first document and start collaborating in real time."}
            </p>

            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                Create your first document
              </button>
            )}
          </div>

        ) : (

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {filteredDocuments.map((document) => (

              <Link
                key={document._id}
                href={`/document/${document._id}`}
                className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-black/20"
              >

                {/* CARD TOP */}

                <div className="flex items-start justify-between">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-lg">
                    📄
                  </div>

                  <span className="rounded-full border border-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                    Document
                  </span>
                </div>

                {/* TITLE */}

                <h3 className="mt-5 truncate text-base font-semibold text-slate-100 transition group-hover:text-blue-400">
                  {document.title}
                </h3>

                {/* DATE */}

                <p className="mt-2 text-xs text-slate-500">
                  Last updated{" "}
                  {new Date(
                    document.updatedAt
                  ).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                {/* FOOTER */}

                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">

                  <span className="text-xs text-slate-600">
                    Open document
                  </span>

                  <span className="text-sm text-blue-500 transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>

              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}