import Document from "../models/Document";
import User from "../models/user";

interface CreateDocumentInput {
    title: string;
    content?: string;
    ownerId: string;
}

export const createDocument = async ({
    title,
    content = "",
    ownerId,
}: CreateDocumentInput) => {

    const document = await Document.create({
        title,
        content,
        owner: ownerId,
    });

    return document;
};


// GET ALL USER DOCUMENTS

export const getUserDocuments = async (userId: string) => {
    const documents = await Document.find({
        $or: [
            { owner: userId },
            { "collaborators.user": userId },
        ],
    })
        .sort({ updatedAt: -1 })
        .select("-content");

    return documents;
};


// OWNER OR COLLABORATOR CAN ACCESS

export const getDocumentById = async (
    documentId: string,
    userId: string
) => {
    const document = await Document.findOne({
        _id: documentId,
        $or: [
            { owner: userId },
            { "collaborators.user": userId },
        ],
    });

    if (!document) {
        throw new Error(
            "Document not found or you don't have access"
        );
    }

    return document;
};


// ADD COLLABORATOR

export const addCollaborator = async (
    documentId: string,
    ownerId: string,
    email: string,
    role: "editor" | "viewer"
) => {

    // Verify document and owner
    const document = await Document.findOne({
        _id: documentId,
        owner: ownerId,
    });

    if (!document) {
        throw new Error(
            "Document not found or you are not the owner"
        );
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("User not found");
    }

    // Owner cannot become collaborator
    if (document.owner.toString() === user._id.toString()) {
        throw new Error(
            "Owner is already part of this document"
        );
    }

    // Check existing collaborator
    const alreadyCollaborator = document.collaborators.some(
        (collaborator) =>
            collaborator.user.toString() === user._id.toString()
    );

    if (alreadyCollaborator) {
        throw new Error("User is already a collaborator");
    }

    // Add collaborator
    document.collaborators.push({
        user: user._id,
        role,
    });

    await document.save();

    return document;
};