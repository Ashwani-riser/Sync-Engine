import Document from "../models/Document";
import DocumentHistory from "../models/DocumentHistory";

export const createDocumentHistory = async ({
    documentId,
    userId,
    action,
    title,
    content,
    version,
}: {
    documentId: string;
    userId: string;
    action: "created" | "updated" | "deleted" | "ai";
    title?: string;
    content?: string;
    version: number;
}) => {
    return await DocumentHistory.create({
        document: documentId,
        user: userId,
        action,
        title,
        content,
        version,
    });
};

export const getDocumentHistory = async (
    documentId: string,
    userId: string
) => {
    const document = await Document.findById(documentId);

    if (!document) {
        throw new Error("Document not found");
    }

    const isOwner = document.owner.toString() === userId;

    const isCollaborator = document.collaborators.some(
        (collaborator) =>
            collaborator.user.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
        throw new Error(
            "You don't have permission to view this document"
        );
    }

    return await DocumentHistory.find({
        document: documentId,
    })
        .populate("user", "name email")
        .sort({ createdAt: -1 });
};