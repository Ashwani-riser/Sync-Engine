import mongoose, { Document as MongooseDocument, Schema } from "mongoose";

export interface IDocument extends MongooseDocument {
    title: string;
    content: string;
    owner: mongoose.Types.ObjectId;
    collaborators: mongoose.Types.ObjectId[];
}

const documentSchema = new Schema<IDocument>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        content: {
            type: String,
            default: "",
        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        collaborators: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Document = mongoose.model<IDocument>(
    "Document",
    documentSchema
);

export default Document;