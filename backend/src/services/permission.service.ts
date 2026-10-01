import Document from "../models/Document";

export type UserRole = "owner" | "editor" | "viewer";



export const getUserRole = async (
    documentId: string,
    userId: string
): Promise<UserRole | null> => {

    const document = await Document.findById(documentId);

    if (!document) {
        return null;
    }

    // Owner
    if (document.owner.toString() === userId) {
        return "owner";
    }

    // Collaborator
    const collaborator = document.collaborators.find(
        (item) => item.user.toString() === userId
    );

    if (!collaborator) {
        return null;
    }

    return collaborator.role;
};