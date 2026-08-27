import Document from "../models/Document";

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
export const getUserDocuments = async (userId: string) => {
    const documents = await Document.find({
        $or: [
            { owner: userId },
            { collaborators: userId },
        ],
    })
        .sort({ updatedAt: -1 })
        .select("-content");

    return documents;
};