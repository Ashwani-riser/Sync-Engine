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