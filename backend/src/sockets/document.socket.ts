import { Server } from "socket.io";

import {
    AuthSocket,
} from "./socket.auth";


import {
    getUserRole,
} from "../services/permission.service";


import {
    updateDocument,
} from "../services/document.service";


import {
    addUserToDocument,
    removeUserFromDocument,
    broadcastPresence,
} from "./presence";


export const registerDocumentSocket = (
    io: Server,
    socket: AuthSocket
) => {


    // ==========================================
    // JOIN DOCUMENT
    // ==========================================

    socket.on(
        "join-document",
        async (
            documentId: string
        ) => {

            try {

                const user =
                    socket.user;


                if (!user) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "Unauthorized",
                        }
                    );

                    return;
                }


                const role =
                    await getUserRole(
                        documentId,
                        user.userId
                    );


                if (!role) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "You don't have access to this document",
                        }
                    );

                    return;
                }


                const room =
                    `document:${documentId}`;


                await socket.join(
                    room
                );


                socket.joinedDocumentId =
                    documentId;


                addUserToDocument(
                    documentId,
                    user.userId
                );


                await broadcastPresence(
                    io,
                    documentId
                );


                console.log(
                    `👤 ${user.email} joined ${room} as ${role}`
                );


                socket.emit(
                    "document-joined",
                    {
                        documentId,
                        role,
                        message:
                            "Joined document successfully",
                    }
                );

            } catch (error) {

                console.error(
                    "Join document error:",
                    error
                );


                socket.emit(
                    "socket-error",
                    {
                        message:
                            "Failed to join document",
                    }
                );

            }

        }
    );


    // ==========================================
    // LIVE TYPING
    // ==========================================

    socket.on(
        "document-typing",
        async (
            data
        ) => {

            try {

                const user =
                    socket.user;


                if (!user) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "Unauthorized",
                        }
                    );

                    return;
                }


                const {
                    documentId,
                    title,
                    content,
                } = data;


                if (!documentId) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "Document ID is required",
                        }
                    );

                    return;
                }


                const role =
                    await getUserRole(
                        documentId,
                        user.userId
                    );


                if (
                    role !== "owner" &&
                    role !== "editor"
                ) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "You don't have permission to edit this document",
                        }
                    );

                    return;
                }


                const room =
                    `document:${documentId}`;


                socket
                    .to(room)
                    .emit(
                        "document-typing",
                        {
                            documentId,
                            title,
                            content,
                            updatedBy:
                                user.userId,
                            updatedByName:
                                user.email,
                        }
                    );

            } catch (error) {

                console.error(
                    "Document typing error:",
                    error
                );


                socket.emit(
                    "socket-error",
                    {
                        message:
                            "Failed to send real-time update",
                    }
                );

            }

        }
    );


    // ==========================================
    // SAVE DOCUMENT
    // ==========================================

    socket.on(
        "document-update",
        async (
            data
        ) => {

            let documentId:
                | string
                | undefined;


            try {

                const user =
                    socket.user;


                if (!user) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "Unauthorized",
                        }
                    );

                    return;
                }


                const {
                    documentId:
                        incomingDocumentId,

                    title,

                    content,

                    expectedVersion,

                } = data;


                documentId =
                    incomingDocumentId;


                if (!documentId) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "Document ID is required",
                        }
                    );

                    return;
                }


                const role =
                    await getUserRole(
                        documentId,
                        user.userId
                    );


                if (
                    role !== "owner" &&
                    role !== "editor"
                ) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                "You don't have permission to edit this document",
                        }
                    );

                    return;
                }


                const updatedDocument =
                    await updateDocument(
                        documentId,
                        user.userId,
                        title,
                        content,
                        expectedVersion
                    );


                const room =
                    `document:${documentId}`;


                io.to(room).emit(
                    "document-updated",
                    {
                        documentId,

                        title:
                            updatedDocument.title,

                        content:
                            updatedDocument.content,

                        version:
                            updatedDocument.version,

                        updatedBy:
                            user.userId,
                    }
                );


                console.log(
                    `${user.email} updated document ${documentId} → version ${updatedDocument.version}`
                );

            } catch (error) {

                console.error(
                    "Document update error:",
                    error
                );


                if (
                    error instanceof Error &&
                    (error as any).code ===
                        "VERSION_CONFLICT"
                ) {

                    socket.emit(
                        "version-conflict",
                        {
                            documentId,

                            message:
                                error.message,

                            document:
                                (error as any)
                                    .document,
                        }
                    );

                    return;
                }


                socket.emit(
                    "socket-error",
                    {
                        message:
                            error instanceof Error
                                ? error.message
                                : "Failed to update document",
                    }
                );

            }

        }
    );


    // ==========================================
    // DISCONNECT
    // ==========================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "🔴 SOCKET DISCONNECTED:",
                socket.id
            );


            if (
                !socket.joinedDocumentId ||
                !socket.user
            ) {

                console.log(
                    "No document/user to clean"
                );

                return;
            }


            const documentId =
                socket.joinedDocumentId;


            removeUserFromDocument(
                documentId,
                socket.user.userId
            );


            broadcastPresence(
                io,
                documentId
            );


            console.log(
                `👋 ${socket.user.email} left document ${documentId}`
            );

        }
    );

};