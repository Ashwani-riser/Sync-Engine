import {
    Request,
    Response,
} from "express";


import {
    AuthRequest,
} from "../middleware/auth.middleware";


import {
    createDocument,
    getUserDocuments,
    getDocumentById,
    addCollaborator,
    updateDocument,
    deleteDocument,
    updateCollaboratorRole,
    removeCollaborator,
} from "../services/document.service";


import {
    getDocumentHistory,
} from "../services/document-history.service";


import {
    AuthSocket,
} from "../sockets/socket.auth";


import {
    removeUserFromDocument,
    broadcastPresence,
} from "../sockets/presence";


// ==========================================
// CREATE DOCUMENT
// ==========================================

export const create = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {

    try {

        const {
            title,
            content,
        } = req.body;


        if (!title) {

            res.status(400).json({
                success: false,
                message:
                    "Document title is required",
            });

            return;
        }


        const ownerId =
            req.user?.userId;


        if (!ownerId) {

            res.status(401).json({
                success: false,
                message:
                    "Unauthorized",
            });

            return;
        }


        const document =
            await createDocument({
                title,
                content,
                ownerId,
            });


        res.status(201).json({
            success: true,
            message:
                "Document created successfully",
            document,
        });

    } catch (error: any) {

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to create document",
        });

    }

};


// ==========================================
// GET ALL DOCUMENTS
// ==========================================

export const getAll = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {

    try {

        const userId =
            req.user?.userId;


        if (!userId) {

            res.status(401).json({
                success: false,
                message:
                    "Unauthorized",
            });

            return;
        }


        const documents =
            await getUserDocuments(
                userId
            );


        res.status(200).json({
            success: true,
            documents,
        });

    } catch (error: any) {

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch documents",
        });

    }

};


// ==========================================
// GET DOCUMENT BY ID
// ==========================================

export const getById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {

    try {

        const documentId =
            req.params.documentId as string;


        if (!documentId) {

            res.status(400).json({
                success: false,
                message:
                    "Document ID is required",
            });

            return;
        }


        const userId =
            req.user?.userId;


        if (!userId) {

            res.status(401).json({
                success: false,
                message:
                    "Unauthorized",
            });

            return;
        }


        const document =
            await getDocumentById(
                documentId,
                userId
            );


        res.status(200).json({
            success: true,
            document,
        });

    } catch (error: any) {

        res.status(404).json({
            success: false,
            message:
                error.message,
        });

    }

};


// ==========================================
// ADD COLLABORATOR
// ==========================================

export const addCollaboratorToDocument =
    async (
        req: AuthRequest,
        res: Response
    ): Promise<void> => {

        try {

            const documentId =
                req.params.documentId as string;


            const {
                email,
                role,
            } = req.body;


            const ownerId =
                req.user?.userId;


            if (!ownerId) {

                res.status(401).json({
                    success: false,
                    message:
                        "Unauthorized",
                });

                return;
            }


            if (!email || !role) {

                res.status(400).json({
                    success: false,
                    message:
                        "Email and role are required",
                });

                return;
            }


            if (
                role !== "editor" &&
                role !== "viewer"
            ) {

                res.status(400).json({
                    success: false,
                    message:
                        "Role must be editor or viewer",
                });

                return;
            }


            const document =
                await addCollaborator(
                    documentId,
                    ownerId,
                    email,
                    role
                );


            res.status(200).json({
                success: true,
                message:
                    "Collaborator added successfully",
                document,
            });

        } catch (error: any) {

            res.status(400).json({
                success: false,
                message:
                    error.message ||
                    "Failed to add collaborator",
            });

        }

    };


// ==========================================
// UPDATE DOCUMENT
// ==========================================

export const update = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {

    try {

        const documentId =
            req.params.documentId as string;


        const userId =
            req.user?.userId;


        if (!userId) {

            res.status(401).json({
                success: false,
                message:
                    "Unauthorized",
            });

            return;
        }


        const {
            title,
            content,
            expectedVersion,
        } = req.body;


        if (
            title === undefined &&
            content === undefined
        ) {

            res.status(400).json({
                success: false,
                message:
                    "Nothing to update",
            });

            return;
        }


        const document =
            await updateDocument(
                documentId,
                userId,
                title,
                content,
                expectedVersion
            );


        res.status(200).json({
            success: true,
            message:
                "Document updated successfully",
            document,
        });

    } catch (error: any) {

        if (
            error?.code ===
            "VERSION_CONFLICT"
        ) {

            res.status(409).json({
                success: false,
                message:
                    error.message,
                document:
                    error.document,
            });

            return;
        }


        res.status(403).json({
            success: false,
            message:
                error.message,
        });

    }

};


// ==========================================
// DELETE DOCUMENT
// ==========================================

export const remove = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {

    try {

        const documentId =
            req.params.documentId as string;


        const userId =
            req.user?.userId;


        if (!userId) {

            res.status(401).json({
                success: false,
                message:
                    "Unauthorized",
            });

            return;
        }


        await deleteDocument(
            documentId,
            userId
        );


        res.status(200).json({
            success: true,
            message:
                "Document deleted successfully",
        });

    } catch (error: any) {

        res.status(403).json({
            success: false,
            message:
                error.message,
        });

    }

};


// ==========================================
// GET HISTORY
// ==========================================

export const getHistory = async (
    req: Request,
    res: Response
) => {

    try {

        const documentId =
            req.params.documentId as string;


        const userId =
            (req as AuthRequest)
                .user!.userId;


        const history =
            await getDocumentHistory(
                documentId,
                userId
            );


        return res.status(200).json({
            success: true,
            history,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch document history",
        });

    }

};


// ==========================================
// UPDATE COLLABORATOR ROLE
// ==========================================

export const updateCollaborator =
    async (
        req: AuthRequest,
        res: Response
    ): Promise<void> => {

        try {

            const documentId =
                req.params.documentId as string;


            const collaboratorId =
                req.params.collaboratorId as string;


            const {
                role,
            } = req.body;


            const ownerId =
                req.user?.userId;


            if (!ownerId) {

                res.status(401).json({
                    success: false,
                    message:
                        "Unauthorized",
                });

                return;
            }


            if (
                role !== "editor" &&
                role !== "viewer"
            ) {

                res.status(400).json({
                    success: false,
                    message:
                        "Role must be editor or viewer",
                });

                return;
            }


            const document =
                await updateCollaboratorRole(
                    documentId,
                    ownerId,
                    collaboratorId,
                    role
                );


            // ======================================
            // SOCKET NOTIFICATION
            // ======================================

            const io =
                req.app.get("io");


            if (io) {

                for (
                    const [
                        socketId,
                        rawSocket,
                    ]
                    of io.sockets.sockets
                ) {

                    const targetSocket =
                        rawSocket as AuthSocket;


                    if (
                        targetSocket.user
                            ?.userId ===
                        collaboratorId
                    ) {

                        targetSocket.emit(
                            "collaborator-role-changed",
                            {
                                documentId,
                                role,
                            }
                        );


                        console.log(
                            `🔄 Role changed for ${targetSocket.user.email} → ${role}`
                        );

                    }

                }

            }


            res.status(200).json({
                success: true,
                message:
                    "Collaborator role updated successfully",
                document,
            });

        } catch (error: any) {

            console.error(
                "Update collaborator error:",
                error
            );


            res.status(400).json({
                success: false,
                message:
                    error.message ||
                    "Failed to update collaborator",
            });

        }

    };


// ==========================================
// REMOVE COLLABORATOR
// ==========================================

export const removeCollaboratorFromDocument =
    async (
        req: AuthRequest,
        res: Response
    ): Promise<void> => {

        try {

            const documentId =
                req.params.documentId as string;


            const collaboratorId =
                req.params.collaboratorId as string;


            const ownerId =
                req.user?.userId;


            if (!ownerId) {

                res.status(401).json({
                    success: false,
                    message:
                        "Unauthorized",
                });

                return;
            }


            const document =
                await removeCollaborator(
                    documentId,
                    ownerId,
                    collaboratorId
                );


            // ======================================
            // SOCKET NOTIFICATION
            // ======================================

            const io =
                req.app.get("io");


            if (io) {

                for (
                    const [
                        socketId,
                        rawSocket,
                    ]
                    of io.sockets.sockets
                ) {

                    const targetSocket =
                        rawSocket as AuthSocket;


                    if (
                        targetSocket.user
                            ?.userId ===
                        collaboratorId
                    ) {

                        // Tell frontend
                        targetSocket.emit(
                            "collaborator-removed",
                            {
                                documentId,
                            }
                        );


                        // Remove from room
                        targetSocket.leave(
                            `document:${documentId}`
                        );


                        // Clear current document
                        targetSocket.joinedDocumentId =
                            undefined;


                        // Remove presence
                        removeUserFromDocument(
                            documentId,
                            collaboratorId
                        );


                        await broadcastPresence(
                            io,
                            documentId
                        );


                        console.log(
                            `🚫 ${targetSocket.user.email} removed from document ${documentId}`
                        );

                    }

                }

            }


            res.status(200).json({
                success: true,
                message:
                    "Collaborator removed successfully",
                document,
            });

        } catch (error: any) {

            console.error(
                "Remove collaborator error:",
                error
            );


            res.status(400).json({
                success: false,
                message:
                    error.message ||
                    "Failed to remove collaborator",
            });

        }

    };