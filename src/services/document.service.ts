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