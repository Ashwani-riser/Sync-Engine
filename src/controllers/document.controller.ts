import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { createDocument } from "../services/document.service";

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
        const ownerId = req.user?.userId;

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