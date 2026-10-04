import Document from "../models/Document";
import User from "../models/user";
import { getUserRole } from "./permission.service";
import { createDocumentHistory } from "./document-history.service";

interface CreateDocumentInput {
    title: string;
    content?: string;
    ownerId: string;
}


// ================= CREATE DOCUMENT =================

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


// ================= GET USER DOCUMENTS =================

export const getUserDocuments = async (userId: string) => {
    const documents = await Document.find({
        $or: [
            { owner: userId },
            { "collaborators.user": userId },
        ],
    })
        .sort({ updatedAt: -1 })
        .select("-content")
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");

    return documents;
};


// ================= GET DOCUMENT BY ID =================

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
    })
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");

    if (!document) {
        throw new Error(
            "Document not found or you don't have access"
        );
    }

    return document;
};


// ================= ADD COLLABORATOR =================

export const addCollaborator = async (
    documentId: string,
    ownerId: string,
    email: string,
    role: "editor" | "viewer"
) => {

    const document = await Document.findOne({
        _id: documentId,
        owner: ownerId,
    });

    if (!document) {
        throw new Error(
            "Document not found or you are not the owner"
        );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
        email: normalizedEmail,
    });

    if (!user) {
        throw new Error(
            "No registered user found with this email"
        );
    }

    // Owner cannot be collaborator
    if (
        document.owner.toString() ===
        user._id.toString()
    ) {
        throw new Error(
            "Owner is already part of this document"
        );
    }

    // Check existing collaborator
    const alreadyCollaborator =
        document.collaborators.some(
            (collaborator) =>
                collaborator.user.toString() ===
                user._id.toString()
        );

    if (alreadyCollaborator) {
        throw new Error(
            "User is already a collaborator"
        );
    }

    document.collaborators.push({
        user: user._id,
        role,
    });

    await document.save();

    return await Document.findById(documentId)
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");
};


// ================= UPDATE COLLABORATOR ROLE =================

export const updateCollaboratorRole = async (
    documentId: string,
    ownerId: string,
    collaboratorId: string,
    role: "editor" | "viewer"
) => {

    const document = await Document.findOne({
        _id: documentId,
        owner: ownerId,
    });

    if (!document) {
        throw new Error(
            "Document not found or you are not the owner"
        );
    }

    const collaborator = document.collaborators.find(
        (item) =>
            item.user.toString() === collaboratorId
    );

    if (!collaborator) {
        throw new Error(
            "Collaborator not found"
        );
    }

    collaborator.role = role;

    await document.save();

    return await Document.findById(documentId)
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");
};


// ================= REMOVE COLLABORATOR =================

export const removeCollaborator = async (
    documentId: string,
    ownerId: string,
    collaboratorId: string
) => {

    const document = await Document.findOne({
        _id: documentId,
        owner: ownerId,
    });

    if (!document) {
        throw new Error(
            "Document not found or you are not the owner"
        );
    }

    const collaboratorExists =
        document.collaborators.some(
            (item) =>
                item.user.toString() === collaboratorId
        );

    if (!collaboratorExists) {
        throw new Error(
            "Collaborator not found"
        );
    }

    document.collaborators =
        document.collaborators.filter(
            (item) =>
                item.user.toString() !== collaboratorId
        );

    await document.save();

    return await Document.findById(documentId)
        .populate("owner", "name email")
        .populate("collaborators.user", "name email");
};


// ================= UPDATE DOCUMENT =================

export const updateDocument = async (
    documentId: string,
    userId: string,
    title?: string,
    content?: string,
    expectedVersion?: number
) => {

    const role = await getUserRole(
        documentId,
        userId
    );

    // Only owner and editor can edit
    if (
        role !== "owner" &&
        role !== "editor"
    ) {
        throw new Error(
            "You don't have permission to edit this document"
        );
    }

    const document = await Document.findById(
        documentId
    );

    if (!document) {
        throw new Error("Document not found");
    }

    // Version conflict check
    if (
        expectedVersion !== undefined &&
        document.version !== expectedVersion
    ) {
        const error = new Error(
            "Document has been modified by another user"
        );

        (error as any).code =
            "VERSION_CONFLICT";

        (error as any).document = {
            title: document.title,
            content: document.content,
            version: document.version,
        };

        throw error;
    }

    if (title !== undefined) {
        document.title = title;
    }

    if (content !== undefined) {
        document.content = content;
    }

    document.version += 1;

    await document.save();

    await createDocumentHistory({
        documentId,
        userId,
        action: "updated",
        title: document.title,
        content: document.content,
        version: document.version,
    });

    return document;
};


// ================= DELETE DOCUMENT =================

export const deleteDocument = async (
    documentId: string,
    userId: string
) => {

    const document = await Document.findOne({
        _id: documentId,
        owner: userId,
    });

    if (!document) {
        throw new Error(
            "Document not found or you are not the owner"
        );
    }

    await Document.deleteOne({
        _id: documentId,
    });

    return document;
};