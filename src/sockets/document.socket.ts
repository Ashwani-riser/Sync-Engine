import { Server } from "socket.io";
import { AuthSocket } from "./socket.auth";
import { getUserRole } from "../services/permission.service";

export const registerDocumentSocket = (
    io: Server,
    socket: AuthSocket
) => {

    // Join document room
    socket.on("join-document", async (documentId: string) => {
        try {
            const user = socket.user;
            
            if (!user) {//Agar socket ke andar authenticated user nahi hai...
                socket.emit("socket-error", {
                    message: "Unauthorized",
                });
                return;
            }

            const role = await getUserRole(
                documentId,
                user.userId
            );

            if (!role) {
                socket.emit("socket-error", {
                    message: "You don't have access to this document",
                });
                return;
            }

            const room = `document:${documentId}`;

            await socket.join(room);

            console.log(
                `👤 ${user.email} joined ${room} as ${role}`
            );

            socket.emit("document-joined", {
                documentId,
                role,
                message: "Joined document successfully",
            });

        } catch (error) {
            console.error("Join document error:", error);

            socket.emit("socket-error", {
                message: "Failed to join document",
            });
        }
    });


    // Update document
    socket.on("document-update", async (data) => {
        try {
            const user = socket.user;

            if (!user) {
                socket.emit("socket-error", {
                    message: "Unauthorized",
                });
                return;
            }

            const { documentId, title, content } = data;

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

            // Only owner/editor can update
            if (role !== "owner" && role !== "editor") {
                socket.emit("socket-error", {
                    message: "You don't have permission to edit this document",
                });
                return;
            }

            const room = `document:${documentId}`;

            io.to(room).emit("document-updated", {
                documentId,
                title,
                content,
                updatedBy: user.userId,
            });

            console.log(
                `📝 ${user.email} updated document ${documentId}`
            );

        } catch (error) {
            console.error("Document update error:", error);

            socket.emit("socket-error", {
                message: "Failed to update document",
            });
        }
    });
};