import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
    createDocument,
    getUserDocuments,
    getDocumentById,
    addCollaborator,
} from "../services/document.service";

export const create = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { title, content } = req.body;

        // Check title
        if (!title) {
            res.status(400).json({
                success: false,
                message: "Document title is required",
            });
            return;
        }

        // Get logged-in user ID from JWT middleware
        const ownerId = req.user?.userId;// jo doc create karaga wo owner ban jayga
        

        if (!ownerId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        // Create document
        const document = await createDocument({
            title,
            content,
            ownerId,
        });

        res.status(201).json({
            success: true,
            message: "Document created successfully",
            document,
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create document",
        });
    }
};
export const getAll = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        const documents = await getUserDocuments(userId);

        res.status(200).json({
            success: true,
            documents,
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch documents",
        });
    }
};


export const getById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const documentId = req.params.documentId as string;

        if (!documentId) {
            res.status(400).json({
                success: false,
                message: "Document ID is required",
            });
            return;
        }

        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        const document = await getDocumentById(
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
            message: error.message,
        });
    }
};

export const addCollaboratorToDocument = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const documentId = req.params.documentId as string;

        const { email, role } = req.body;

        // Logged-in user
        const ownerId = req.user?.userId;

        if (!ownerId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        // Validate input
        if (!email || !role) {
            res.status(400).json({
                success: false,
                message: "Email and role are required",
            });
            return;
        }

        // Validate role
        if (role !== "editor" && role !== "viewer") {
            res.status(400).json({
                success: false,
                message: "Role must be editor or viewer",
            });
            return;
        }

        const document = await addCollaborator(
            documentId,
            ownerId,
            email,
            role
        );

        res.status(200).json({
            success: true,
            message: "Collaborator added successfully",
            document,
        });

    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to add collaborator",
        });
    }
};