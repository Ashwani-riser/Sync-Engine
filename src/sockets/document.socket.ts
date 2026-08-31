import { Server, Socket } from "socket.io";

export const registerDocumentSocket = (
    io: Server,
    socket: Socket
) => {

    socket.on("join-document", async (documentId: string) => {
        try {
            const room = `document:${documentId}`;

            await socket.join(room);

            console.log(
                `👤 ${socket.id} joined ${room}`
            );

            socket.emit("document-joined", {
                documentId,
                message: "Joined document successfully",
            });

        } catch (error) {
            socket.emit("socket-error", {
                message: "Failed to join document",
            });
        }
    });

};