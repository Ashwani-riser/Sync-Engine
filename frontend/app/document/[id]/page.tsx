"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

interface CollaboratorUser {
    _id: string;
    name: string;
    email: string;
}

interface DocumentData {
    _id: string;
    title: string;
    content: string;
    version: number;
    owner:
        | string
        | {
              _id: string;
              name: string;
              email: string;
          };

    collaborators: {
        user: string | CollaboratorUser;
        role: "editor" | "viewer";
    }[];

    createdAt: string;
    updatedAt: string;
}
interface HistoryItem {
    _id: string;
    action: "created" | "updated" | "deleted" | "ai";
    title?: string;
    content?: string;
    version: number;
    user:
        | string
        | {
              _id: string;
              name: string;
              email: string;
          };
    createdAt: string;
}

interface PresenceUser {
    userId: string;
    name: string;
    email?: string;
}

interface PresenceData {
    documentId: string;
    users: PresenceUser[];
}

type UserRole = "owner" | "editor" | "viewer";

export default function DocumentPage() {
    const params = useParams();
    const router = useRouter();

    const documentId = params.id as string;

    const socketRef = useRef<Socket | null>(null);

    const typingTimeoutRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const [document, setDocument] =
        useState<DocumentData | null>(null);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [version, setVersion] = useState(0);

    const [role, setRole] =
        useState<UserRole>("viewer");

    const [onlineUsers, setOnlineUsers] =
        useState<PresenceUser[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [aiLoading, setAiLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [dirty, setDirty] =
        useState(false);

    // ================= SHARE STATE =================

    const [shareOpen, setShareOpen] =
        useState(false);

    const [shareEmail, setShareEmail] =
        useState("");

    const [shareRole, setShareRole] =
        useState<"editor" | "viewer">("editor");

    const [shareLoading, setShareLoading] =
        useState(false);

    const [roleUpdatingId, setRoleUpdatingId] =
        useState<string | null>(null);

    const [removeLoadingId, setRemoveLoadingId] =
        useState<string | null>(null);

    const canEdit =
        role === "owner" || role === "editor";

    const canDelete =
        role === "owner";

    // ================= HISTORY STATE =================

const [historyOpen, setHistoryOpen] = useState(false);

const [historyLoading, setHistoryLoading] =
    useState(false);

const [history, setHistory] =
    useState<HistoryItem[]>([]);     


    // ========================================
    // LOAD DOCUMENT
    // ========================================

    const loadDocument = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,
                {
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "Failed to load document"
                );

                if (response.status === 401) {
                    router.push("/");
                }

                return;
            }

            const doc = data.document;

            setDocument(doc);
            setTitle(doc.title);
            setContent(doc.content);
            setVersion(doc.version);

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to load document"
            );
        } finally {
            setLoading(false);
        }
    };


    // ========================================
    // SOCKET CONNECTION
    // ========================================

    useEffect(() => {
        if (!documentId) return;

        const socket = io(
            process.env.NEXT_PUBLIC_API_URL,
            {
                withCredentials: true,
            }
        );

        socketRef.current = socket;


        // CONNECT

        socket.on("connect", () => {
            console.log(
                "🔌 Connected:",
                socket.id
            );

            socket.emit(
                "join-document",
                documentId
            );
        });


        // JOINED

        socket.on(
            "document-joined",
            (data) => {
                console.log(
                    "📄 Document joined:",
                    data
                );

                if (data.role) {
                    setRole(data.role);
                }

                setMessage(
                    `Connected as ${data.role}`
                );
            }
        );
        // ========================================
// COLLABORATOR ROLE CHANGED
// ========================================

socket.on(
    "collaborator-role-changed",
    (data) => {

        console.log(
            "🔄 Role changed:",
            data
        );

        if (
            data.documentId !== documentId
        ) {
            return;
        }

        setRole(
            data.role
        );

        setMessage(
            `Your role changed to ${data.role}`
        );
    }
);


// ========================================
// COLLABORATOR REMOVED
// ========================================

socket.on(
    "collaborator-removed",
    (data) => {

        console.log(
            "🚫 Removed from document:",
            data
        );

        if (
            data.documentId !== documentId
        ) {
            return;
        }

        setMessage(
            "You no longer have access to this document"
        );

        setTimeout(() => {

            router.push(
                "/dashboard"
            );

        }, 1200);
    }
);


        // LIVE TYPING

        socket.on(
            "document-typing",
            (data) => {
                console.log(
                    "⚡ Live update:",
                    data
                );

                setTitle(data.title);
                setContent(data.content);

                setDirty(true);

                if (data.updatedByName) {
                    setMessage(
                        `${data.updatedByName} is editing...`
                    );
                }
            }
        );


        // SAVED DOCUMENT UPDATE

        socket.on(
            "document-updated",
            (data) => {
                console.log(
                    "🔥 Saved update:",
                    data
                );

                setTitle(data.title);
                setContent(data.content);
                setVersion(data.version);

                setDirty(false);

                setMessage(
                    "Document saved"
                );
            }
        );


        // PRESENCE

        socket.on(
            "presence-updated",
            (data: PresenceData) => {
                console.log(
                    "👥 Presence:",
                    data
                );

                setOnlineUsers(
                    data.users || []
                );
            }
        );


        // VERSION CONFLICT

        socket.on(
            "version-conflict",
            (data) => {
                console.log(
                    "⚠️ Version conflict:",
                    data
                );

                setMessage(
                    "Document was modified by another user. Latest version loaded."
                );

                if (data.document) {
                    setTitle(
                        data.document.title
                    );

                    setContent(
                        data.document.content
                    );

                    setVersion(
                        data.document.version
                    );

                    setDirty(false);
                }
            }
        );


        // SOCKET ERROR

        socket.on(
            "socket-error",
            (data) => {
                console.error(
                    "Socket error:",
                    data
                );

                setMessage(
                    data.message ||
                    "Socket error"
                );
            }
        );


        // CONNECTION ERROR

        socket.on(
            "connect_error",
            (error) => {
                console.error(
                    "Socket connection error:",
                    error
                );

                setMessage(
                    "Unable to connect to real-time server"
                );
            }
        );


        // DISCONNECT

        socket.on(
            "disconnect",
            () => {
                console.log(
                    "🔴 Socket disconnected"
                );

                setMessage(
                    "Real-time connection disconnected"
                );
            }
        );


        return () => {
            console.log(
                "Cleaning up socket"
            );

            if (typingTimeoutRef.current) {
                clearTimeout(
                    typingTimeoutRef.current
                );
            }

            socket.disconnect();

            socketRef.current = null;
        };

    }, [documentId]);


    // ========================================
    // LOAD DOCUMENT ON PAGE OPEN
    // ========================================

    useEffect(() => {
        if (documentId) {
            loadDocument();
        }
    }, [documentId]);


    // ========================================
    // LIVE TITLE CHANGE
    // ========================================

    const handleTitleChange = (
        value: string
    ) => {
        if (!canEdit) return;

        setTitle(value);
        setDirty(true);

        sendTypingUpdate(
            value,
            content
        );
    };


    // ========================================
    // LIVE CONTENT CHANGE
    // ========================================

    const handleContentChange = (
        value: string
    ) => {
        if (!canEdit) return;

        setContent(value);
        setDirty(true);

        sendTypingUpdate(
            title,
            value
        );
    };


    // ========================================
    // SEND TYPING UPDATE
    // ========================================

    const sendTypingUpdate = (
        currentTitle: string,
        currentContent: string
    ) => {
        if (
            !socketRef.current ||
            !socketRef.current.connected ||
            !canEdit
        ) {
            return;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(
                typingTimeoutRef.current
            );
        }

        typingTimeoutRef.current =
            setTimeout(() => {
                socketRef.current?.emit(
                    "document-typing",
                    {
                        documentId,
                        title: currentTitle,
                        content: currentContent,
                    }
                );
            }, 150);
    };


    // ========================================
    // SAVE
    // ========================================

    const handleSave = async () => {
        if (!document || !canEdit) {
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials: "include",

                        body: JSON.stringify({
                            title,
                            content,
                            expectedVersion:
                                version,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                if (
                    response.status === 409
                ) {
                    setMessage(
                        "Document was modified by another user. Reloading..."
                    );

                    await loadDocument();

                    return;
                }

                setMessage(
                    data.message ||
                    "Failed to save document"
                );

                return;
            }

            const updatedDocument =
                data.document;

            setDocument(
                updatedDocument
            );

            setTitle(
                updatedDocument.title
            );

            setContent(
                updatedDocument.content
            );

            setVersion(
                updatedDocument.version
            );

            setDirty(false);

            setMessage(
                "Saved successfully"
            );

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to save document"
            );

        } finally {
            setSaving(false);
        }
    };


    // ========================================
    // AI
    // ========================================

    const handleAI = async (
        action:
            | "summarize"
            | "improve"
            | "rewrite"
            | "explain"
    ) => {
        if (!canEdit) {
            setMessage(
                "You don't have permission to edit this document"
            );

            return;
        }

        setAiLoading(true);

        setMessage(
            `AI is working on ${action}...`
        );

        try {
            const response =
                await fetch(
                     `${process.env.NEXT_PUBLIC_API_URL}/api/ai/assist`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials: "include",

                        body: JSON.stringify({
                            documentId,
                            action,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setMessage(
                    data.message ||
                    "AI request failed"
                );

                return;
            }

            setContent(
                data.result
            );

            setDirty(true);

            sendTypingUpdate(
                title,
                data.result
            );

            setMessage(
                `AI ${action} completed`
            );

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to connect to AI"
            );

        } finally {
            setAiLoading(false);
        }
    };


    // ========================================
    // DELETE
    // ========================================

    const handleDelete = async () => {
        if (!canDelete) {
            setMessage(
                "Only the document owner can delete this document"
            );

            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this document?"
            );

        if (!confirmed) {
            return;
        }

        try {
            const response =
                await fetch(
                     `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,
                    {
                        method: "DELETE",
                        credentials: "include",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setMessage(
                    data.message ||
                    "Failed to delete document"
                );

                return;
            }

            router.push(
                "/dashboard"
            );

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to delete document"
            );
        }
    };
    // ========================================
// HISTORY
// ========================================

const handleHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setMessage("");

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,
            {
                credentials: "include",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setMessage(
                data.message || "Failed to load history"
            );
            return;
        }

        setHistory(data.history || []);
    } catch (error) {
        console.error(error);

        setMessage(
            "Unable to load document history"
        );
    } finally {
        setHistoryLoading(false);
    }
};


    // ========================================
    // SHARE DOCUMENT
    // ========================================

    const handleShare = async () => {
        if (role !== "owner") {
            setMessage(
                "Only the owner can share this document"
            );

            return;
        }

        if (!shareEmail.trim()) {
            setMessage(
                "Please enter an email"
            );

            return;
        }

        setShareLoading(true);
        setMessage("");

        try {
            const response =
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/collaborators`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials: "include",

                        body: JSON.stringify({
                            email:
                                shareEmail
                                    .trim()
                                    .toLowerCase(),

                            role: shareRole,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setMessage(
                    data.message ||
                    "Failed to share document"
                );

                return;
            }

            setDocument(
                data.document
            );

            setShareEmail("");

            setShareRole(
                "editor"
            );

            setMessage(
                "Document shared successfully"
            );

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to share document"
            );

        } finally {
            setShareLoading(false);
        }
    };


    // ========================================
    // UPDATE COLLABORATOR ROLE
    // ========================================

    const handleRoleChange = async (
        collaboratorId: string,
        newRole: "editor" | "viewer"
    ) => {
        setRoleUpdatingId(
            collaboratorId
        );

        try {
            const response =
                await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials: "include",

                        body: JSON.stringify({
                            role: newRole,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setMessage(
                    data.message ||
                    "Failed to update role"
                );

                return;
            }

            setDocument(
                data.document
            );

            setMessage(
                "Collaborator role updated"
            );

        } catch (error) {
            console.error(error);

            setMessage(
                "Unable to update collaborator role"
            );

        } finally {
            setRoleUpdatingId(null);
        }
    };


    // ========================================
    // REMOVE COLLABORATOR
    // ========================================

    const handleRemoveCollaborator =
        async (
            collaboratorId: string
        ) => {
            const confirmed =
                window.confirm(
                    "Remove this collaborator from the document?"
                );

            if (!confirmed) {
                return;
            }

            setRemoveLoadingId(
                collaboratorId
            );

            try {
                const response =
                    await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}`,   
                        {
                            method: "DELETE",
                            credentials: "include",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    setMessage(
                        data.message ||
                        "Failed to remove collaborator"
                    );

                    return;
                }

                setDocument(
                    data.document
                );

                setMessage(
                    "Collaborator removed"
                );

            } catch (error) {
                console.error(error);

                setMessage(
                    "Unable to remove collaborator"
                );

            } finally {
                setRemoveLoadingId(null);
            }
        };


    // ========================================
    // ROLE LABEL
    // ========================================

    const roleLabel =
        role === "owner"
            ? "Owner"
            : role === "editor"
            ? "Editor"
            : "Viewer";


    // ========================================
    // LOADING
    // ========================================

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="text-center">

                    <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                        <span className="font-bold text-white">
                            C
                        </span>
                    </div>

                    <p className="text-sm text-slate-400">
                        Loading document...
                    </p>

                </div>
            </main>
        );
    }


    // ========================================
    // UI
    // ========================================

    return (
        <main className="min-h-screen bg-slate-950 text-white">

            {/* ======================================
                NAVBAR
            ====================================== */}

            <header className="border-b border-slate-800 bg-slate-950">

                <div className="mx-auto flex min-h-16 max-w-[1650px] items-center justify-between gap-4 px-6 py-3 lg:px-8">

                    {/* LEFT */}

                    <div className="flex min-w-0 items-center gap-4">

                        <button
                            onClick={() =>
                                router.push(
                                    "/dashboard"
                                )
                            }
                            className="flex h-9 items-center rounded-lg border border-slate-800 px-3 text-sm text-slate-400 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
                        >
                            ←

                            <span className="ml-2 hidden sm:inline">
                                Dashboard
                            </span>
                        </button>


                        <div className="hidden h-7 w-px bg-slate-800 sm:block" />


                        {/* BRAND */}

                        <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/20">
                                <span className="font-bold text-white">
                                    C
                                </span>
                            </div>

                            <div className="hidden leading-none md:block">

                                <h1 className="text-[16px] font-bold tracking-tight">
                                    Collab
                                    <span className="text-blue-500">
                                        Flow
                                    </span>
                                </h1>

                                <p className="mt-1 text-[10px] text-slate-600">
                                    Real-time workspace
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* RIGHT */}

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">

                        {/* CONNECTION */}

                        <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 sm:flex">

                            <span
                                className={`h-2 w-2 rounded-full ${
                                    socketRef.current?.connected
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                }`}
                            />

                            <span className="text-xs text-slate-400">
                                {onlineUsers.length} online
                            </span>

                        </div>


                        {/* ROLE */}

                        <span
                            className={`rounded-lg px-3 py-2 text-xs font-medium ${
                                role === "owner"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : role === "editor"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-slate-800 text-slate-400"
                            }`}
                        >
                            {roleLabel}
                        </span>


                        {/* VERSION */}

                        <span className="hidden rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400 sm:block">
                            v{version}
                        </span>

                        <button
                              onClick={handleHistory}
                              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                              History
                        </button>


                        {/* SHARE */}

                        {role === "owner" && (
                            <button
                                onClick={() =>
                                    setShareOpen(true)
                                }
                                className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-400 transition hover:border-blue-500 hover:bg-blue-500/20 hover:text-blue-300"
                            >
                                Share
                            </button>
                        )}


                        {/* DELETE */}

                        {canDelete && (
                            <button
                                onClick={
                                    handleDelete
                                }
                                className="hidden rounded-lg border border-red-900/70 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950 sm:block"
                            >
                                Delete
                            </button>
                        )}


                        {/* SAVE */}

                        {canEdit && (
                            <button
                                onClick={
                                    handleSave
                                }
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save"}
                            </button>
                        )}

                    </div>

                </div>

            </header>


            {/* ======================================
                MAIN
            ====================================== */}

            <div className="mx-auto max-w-[1650px] px-6 py-7 lg:px-8">

                {/* DOCUMENT HEADER */}

                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                    <div className="min-w-0 flex-1">

                        <div className="mb-2 flex items-center gap-2">

                            <span className="text-xs font-medium uppercase tracking-wider text-blue-500">
                                Document
                            </span>

                            {dirty && canEdit && (
                                <>
                                    <span className="text-slate-700">
                                        •
                                    </span>

                                    <span className="text-xs text-amber-500">
                                        Unsaved changes
                                    </span>
                                </>
                            )}

                        </div>


                        <input
                            type="text"
                            value={title}
                            disabled={!canEdit}
                            onChange={(e) =>
                                handleTitleChange(
                                    e.target.value
                                )
                            }
                            placeholder="Document title"
                            className="w-full bg-transparent text-3xl font-bold tracking-tight text-white outline-none placeholder:text-slate-700 disabled:cursor-default"
                        />


                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">

                            <span>
                                Version {version}
                            </span>

                            <span className="text-slate-700">
                                •
                            </span>

                            <span>
                                {canEdit
                                    ? "You can edit this document"
                                    : "Read-only access"}
                            </span>

                        </div>

                    </div>


                    {/* ONLINE USERS */}

                    <div className="flex items-center gap-2">

                        {onlineUsers
                            .slice(0, 5)
                            .map((user, index) => (
                                <div
                                    key={
                                        user.userId
                                    }
                                    title={
                                        user.name
                                    }
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-blue-${
                                        index % 2 === 0
                                            ? "600"
                                            : "500"
                                    } text-xs font-semibold text-white`}
                                >
                                    {user.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>
                            ))}


                        {onlineUsers.length >
                            5 && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-xs text-slate-400">
                                +
                                {onlineUsers.length -
                                    5}
                            </div>
                        )}


                        <span className="ml-1 text-xs text-slate-500">
                            {onlineUsers.length}{" "}
                            online
                        </span>

                    </div>

                </div>


                {/* MESSAGE */}

                {message && (
                    <div className="mb-5 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">

                        <p className="text-sm text-slate-400">
                            {message}
                        </p>

                        <button
                            onClick={() =>
                                setMessage("")
                            }
                            className="ml-4 text-slate-600 transition hover:text-slate-300"
                        >
                            ✕
                        </button>

                    </div>
                )}


                {/* ONLINE USERS PANEL */}

                {onlineUsers.length > 0 && (
                    <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900 p-4">

                        <div className="mb-3 flex items-center justify-between">

                            <div>
                                <p className="text-sm font-medium text-slate-200">
                                    People in this document
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                    Changes are synced in real time
                                </p>
                            </div>

                            <span className="flex items-center gap-2 text-xs text-green-500">

                                <span className="h-2 w-2 rounded-full bg-green-500" />

                                Live

                            </span>

                        </div>


                        <div className="flex flex-wrap gap-2">

                            {onlineUsers.map(
                                (user) => (
                                    <div
                                        key={
                                            user.userId
                                        }
                                        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                                    >

                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-[10px] font-semibold text-blue-400">
                                            {user.name
                                                ?.charAt(
                                                    0
                                                )
                                                .toUpperCase()}
                                        </span>

                                        <span className="text-xs text-slate-400">
                                            {user.name}
                                        </span>

                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                                    </div>
                                )
                            )}

                        </div>

                    </div>
                )}


                {/* EDITOR */}

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/10">

                    {/* EDITOR TOOLBAR */}

                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">

                        <div className="flex items-center gap-3">

                            <div className="flex gap-1">

                                <span className="h-2 w-2 rounded-full bg-red-500/70" />

                                <span className="h-2 w-2 rounded-full bg-yellow-500/70" />

                                <span className="h-2 w-2 rounded-full bg-green-500/70" />

                            </div>

                            <span className="hidden text-xs text-slate-600 sm:block">
                                Collaborative Editor
                            </span>

                        </div>


                        <div className="flex items-center gap-3">

                            {canEdit ? (
                                <span className="flex items-center gap-2 text-xs text-green-500">

                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                                    Editing enabled

                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-xs text-slate-500">

                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />

                                    Read only

                                </span>
                            )}

                        </div>

                    </div>


                    {/* TEXT AREA */}

                    <textarea
                        value={content}
                        disabled={!canEdit}
                        onChange={(e) =>
                            handleContentChange(
                                e.target.value
                            )
                        }
                        placeholder={
                            canEdit
                                ? "Start writing your document..."
                                : "This document is read-only."
                        }
                        spellCheck={true}
                        className="min-h-[560px] w-full resize-none bg-slate-950/40 p-6 text-[15px] leading-7 text-slate-200 outline-none placeholder:text-slate-700 disabled:cursor-not-allowed disabled:opacity-70 lg:p-8"
                    />


                    {/* EDITOR FOOTER */}

                    <div className="flex flex-col gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-4 text-xs text-slate-600">

                            <span>
                                {content.length} characters
                            </span>

                            <span>
                                {content.trim()
                                    ? content
                                          .trim()
                                          .split(
                                              /\s+/
                                          )
                                          .length
                                    : 0}{" "}
                                words
                            </span>

                        </div>

                        <div className="text-xs text-slate-600">
                            {dirty
                                ? "Changes not saved"
                                : "All changes saved"}
                        </div>

                    </div>

                </div>


                {/* AI ASSISTANT */}

                <div className="mt-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

                    <div className="border-b border-slate-800 px-5 py-4">

                        <div className="flex items-start justify-between gap-4">

                            <div>

                                <div className="flex items-center gap-2">

                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 text-sm">
                                        ✦
                                    </span>

                                    <h2 className="font-semibold text-white">
                                        AI Assistant
                                    </h2>

                                </div>

                                <p className="mt-1 text-xs text-slate-600">
                                    Improve and work with your document using AI.
                                </p>

                            </div>

                            {aiLoading && (
                                <div className="flex items-center gap-2 text-xs text-blue-400">

                                    <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

                                    AI working...

                                </div>
                            )}

                        </div>

                    </div>


                    <div className="p-5">

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                            <button
                                disabled={
                                    !canEdit ||
                                    aiLoading
                                }
                                onClick={() =>
                                    handleAI(
                                        "summarize"
                                    )
                                }
                                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Summarize
                            </button>


                            <button
                                disabled={
                                    !canEdit ||
                                    aiLoading
                                }
                                onClick={() =>
                                    handleAI(
                                        "improve"
                                    )
                                }
                                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Improve
                            </button>


                            <button
                                disabled={
                                    !canEdit ||
                                    aiLoading
                                }
                                onClick={() =>
                                    handleAI(
                                        "rewrite"
                                    )
                                }
                                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Rewrite
                            </button>


                            <button
                                disabled={
                                    !canEdit ||
                                    aiLoading
                                }
                                onClick={() =>
                                    handleAI(
                                        "explain"
                                    )
                                }
                                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Explain
                            </button>

                        </div>


                        {!canEdit && (
                            <p className="mt-4 text-xs text-slate-600">
                                AI editing tools are available to document owners and editors.
                            </p>
                        )}

                    </div>

                </div>


                {/* DOCUMENT INFO */}

                {document && (
                    <div className="mt-6 flex flex-col gap-2 border-t border-slate-900 pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            Created{" "}
                            {new Date(
                                document.createdAt
                            ).toLocaleString()}
                        </div>

                        <div>
                            Last updated{" "}
                            {new Date(
                                document.updatedAt
                            ).toLocaleString()}
                        </div>

                    </div>
                )}

            </div>

{/* ========================================
    HISTORY MODAL
======================================== */}

{historyOpen && (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">

        {/* BACKDROP */}
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
        />

        {/* CENTER */}
        <div className="relative flex min-h-full items-center justify-center p-4">

            {/* MODAL */}
            <div
                className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* HEADER */}
                <div className="mb-6 flex items-start justify-between">

                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Document History
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            View previous versions and changes.
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            setHistoryOpen(false)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-800 hover:text-white"
                    >
                        ×
                    </button>

                </div>


                {/* LOADING */}
                {historyLoading && (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-sm text-slate-500">
                            Loading history...
                        </p>
                    </div>
                )}


                {/* EMPTY */}
                {!historyLoading &&
                    history.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">
                            <p className="text-sm text-slate-500">
                                No history available yet.
                            </p>
                        </div>
                    )}


                {/* HISTORY LIST */}
                {!historyLoading &&
                    history.length > 0 && (
                        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-2">

                            {history.map(
                                (item, index) => {

                                    const user =
                                        typeof item.user ===
                                        "string"
                                            ? null
                                            : item.user;

                                    return (
                                        <div
                                            key={
                                                item._id ||
                                                index
                                            }
                                            className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                        >

                                            {/* TOP */}
                                            <div className="flex items-start justify-between gap-4">

                                                <div>

                                                    <p className="text-sm font-medium text-white">
                                                        Version{" "}
                                                        {item.version}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {user?.name ||
                                                            "Unknown user"}
                                                    </p>

                                                    {user?.email && (
                                                        <p className="text-xs text-slate-600">
                                                            {
                                                                user.email
                                                            }
                                                        </p>
                                                    )}

                                                    <p className="mt-1 text-xs text-slate-600">
                                                        {new Date(
                                                            item.createdAt
                                                        ).toLocaleString()}
                                                    </p>

                                                </div>


                                                {/* ACTION */}
                                                <span
                                                    className={`rounded-md px-2 py-1 text-xs ${
                                                        item.action ===
                                                        "created"
                                                            ? "bg-green-500/10 text-green-400"
                                                            : item.action ===
                                                              "updated"
                                                            ? "bg-blue-500/10 text-blue-400"
                                                            : item.action ===
                                                              "ai"
                                                            ? "bg-purple-500/10 text-purple-400"
                                                            : "bg-red-500/10 text-red-400"
                                                    }`}
                                                >
                                                    {item.action}
                                                </span>

                                            </div>


                                            {/* TITLE */}
                                            {item.title && (
                                                <div className="mt-4">

                                                    <p className="mb-1 text-xs text-slate-600">
                                                        Title
                                                    </p>

                                                    <p className="text-sm text-slate-300">
                                                        {item.title}
                                                    </p>

                                                </div>
                                            )}


                                            {/* CONTENT */}
                                            {item.content && (
                                                <div className="mt-4">

                                                    <p className="mb-1 text-xs text-slate-600">
                                                        Content
                                                    </p>

                                                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-3">

                                                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                                            {
                                                                item.content
                                                            }
                                                        </p>

                                                    </div>

                                                </div>
                                            )}

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

            </div>
        </div>
    </div>
)}

  {/* ========================================
    SHARE MODAL
======================================== */}

{shareOpen && role === "owner" && (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">

        {/* BACKDROP */}
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShareOpen(false)}
        />

        {/* CENTER CONTAINER */}
        <div className="relative flex min-h-full items-center justify-center p-4">

            {/* MODAL */}
            <div
                className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* HEADER */}
                <div className="mb-6 flex items-start justify-between">

                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Share document
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Give someone access to this document.
                        </p>
                    </div>

                    <button
                        onClick={() => setShareOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-800 hover:text-white"
                    >
                        ×
                    </button>

                </div>


                {/* EMAIL */}
                <div className="mb-5">

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Email address
                    </label>

                    <input
                        type="email"
                        value={shareEmail}
                        onChange={(e) =>
                            setShareEmail(e.target.value)
                        }
                        placeholder="user@example.com"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />

                </div>


                {/* PERMISSION */}
                <div className="mb-6">

                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Permission
                    </label>

                    <select
                        value={shareRole}
                        onChange={(e) =>
                            setShareRole(
                                e.target.value as
                                    | "editor"
                                    | "viewer"
                            )
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="editor">
                            Editor — can edit
                        </option>

                        <option value="viewer">
                            Viewer — read only
                        </option>
                    </select>

                </div>


                {/* SHARE BUTTON */}
                <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {shareLoading
                        ? "Sharing..."
                        : "Share document"}
                </button>


                {/* COLLABORATORS */}
                {document &&
                    document.collaborators.length > 0 && (
                        <div className="mt-7 border-t border-slate-800 pt-6">

                            <h3 className="mb-4 text-sm font-semibold text-white">
                                People with access
                            </h3>

                            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">

                                {document.collaborators.map(
                                    (collaborator, index) => {

                                        const user =
                                            typeof collaborator.user ===
                                            "string"
                                                ? null
                                                : collaborator.user;

                                        const collaboratorId =
                                            user?._id ||
                                            (typeof collaborator.user ===
                                            "string"
                                                ? collaborator.user
                                                : "");

                                        return (
                                            <div
                                                key={
                                                    collaboratorId ||
                                                    index
                                                }
                                                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-3"
                                            >

                                                {/* USER INFO */}
                                                <div className="min-w-0">

                                                    <div className="flex items-center gap-2">

                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-semibold text-blue-400">
                                                            {user?.name
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                .toUpperCase() ||
                                                                "U"}
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="truncate text-sm font-medium text-slate-200">
                                                                {user?.name ||
                                                                    "Collaborator"}
                                                            </p>

                                                            <p className="truncate text-xs text-slate-600">
                                                                {user?.email ||
                                                                    ""}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </div>


                                                {/* ACTIONS */}
                                                <div className="flex shrink-0 items-center gap-2">

                                                    <select
                                                        value={
                                                            collaborator.role
                                                        }
                                                        disabled={
                                                            roleUpdatingId ===
                                                            collaboratorId
                                                        }
                                                        onChange={(e) =>
                                                            handleRoleChange(
                                                                collaboratorId,
                                                                e.target
                                                                    .value as
                                                                    | "editor"
                                                                    | "viewer"
                                                            )
                                                        }
                                                        className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-500"
                                                    >
                                                        <option value="editor">
                                                            Editor
                                                        </option>

                                                        <option value="viewer">
                                                            Viewer
                                                        </option>
                                                    </select>


                                                    <button
                                                        onClick={() =>
                                                            handleRemoveCollaborator(
                                                                collaboratorId
                                                            )
                                                        }
                                                        disabled={
                                                            removeLoadingId ===
                                                            collaboratorId
                                                        }
                                                        className="rounded-md border border-red-900/60 px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-950 disabled:opacity-50"
                                                    >
                                                        {removeLoadingId ===
                                                        collaboratorId
                                                            ? "..."
                                                            : "Remove"}
                                                    </button>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </div>
                    )}

            </div>

        </div>

    </div>
)}
        </main>
    );
}