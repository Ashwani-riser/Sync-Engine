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

//owner or collaborator hi acces kar payga
export const getDocumentById = async (
    documentId: string,
    userId: string
) => {
    const document = await Document.findOne({
        _id: documentId,
        $or: [
            { owner: userId },
            { collaborators: userId },
        ],
    });

    if (!document) {
        throw new Error(
            "Document not found or you don't have access"
        );
    }

    return document;
};