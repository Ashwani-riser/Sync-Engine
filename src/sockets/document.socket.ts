import { Server } from "socket.io";
import { AuthSocket } from "./socket.auth";
import { getUserRole } from "../services/permission.service";
import { updateDocument } from "../services/document.service";

export const registerDocumentSocket = (
    io: Server,
    socket: AuthSocket
) => {

    // JOIN DOCUMENT ROOM
    socket.on("join-document", async (documentId: string) => {
        try {
            const user = socket.user;

            // Check authentication
            if (!user) {
                socket.emit("socket-error", {
                    message: "Unauthorized",
                });
                return;
            }

            // Check user's access to document
            const role = await getUserRole(
                documentId,
                user.userId
            );

            // No access
            if (!role) {
                socket.emit("socket-error", {
                    message: "You don't have access to this document",
                });
                return;
            }

            // Create room name
            const room = `document:${documentId}`;

            // Join room
            await socket.join(room);

            console.log(
                `👤 ${user.email} joined ${room} as ${role}`
            );

            // Tell client that joining was successful
            socket.emit("document-joined", {
                documentId,
                role,
                message: "Joined document successfully",
            });

        } catch (error) {
            console.error(
                "Join document error:",
                error
            );

            socket.emit("socket-error", {
                message: "Failed to join document",
            });
        }
    });

   //UPDATE DOCUMENT

    socket.on("document-update", async (data) => {
    let documentId: string | undefined;

    try {
        const user = socket.user;

        if (!user) {
            socket.emit("socket-error", {
                message: "Unauthorized",
            });
            return;
        }

        const {
            documentId: incomingDocumentId,
            title,
            content,
            expectedVersion,
        } = data;

        documentId = incomingDocumentId;

        if (!documentId) {
            socket.emit("socket-error", {
                message: "Document ID is required",
            });
            return;
        }

        const role = await getUserRole(
            documentId,
            user.userId
        );

        if (role !== "owner" && role !== "editor") {
            socket.emit("socket-error", {
                message: "You don't have permission to edit this document",
            });
            return;
        }

        const updatedDocument = await updateDocument(
            documentId,
            user.userId,
            title,
            content,
            expectedVersion
        );

        const room = `document:${documentId}`;

        io.to(room).emit("document-updated", {
            documentId,
            title: updatedDocument.title,
            content: updatedDocument.content,
            version: updatedDocument.version,
            updatedBy: user.userId,
        });

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
            (error as any).code === "VERSION_CONFLICT"
        ) {
            socket.emit("version-conflict", {
                documentId,
                message: error.message,
                document: (error as any).document,
            });

            return;
        }

        socket.emit("socket-error", {
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to update document",
        });
    }
  });
};