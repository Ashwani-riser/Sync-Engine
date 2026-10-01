import mongoose, { Document, Schema } from "mongoose";

export interface IDocumentHistory extends Document {
    document: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    action: "created" | "updated" | "deleted" | "ai";
    title?: string;
    content?: string;
    version: number;
    createdAt: Date;
}

const documentHistorySchema = new Schema<IDocumentHistory>(
    {
        document: {
            type: Schema.Types.ObjectId,
            ref: "Document",
            required: true,
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            enum: ["created", "updated", "deleted", "ai"],
            required: true,
        },

        title: String,

        content: String,

        version: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IDocumentHistory>(
    "DocumentHistory",
    documentHistorySchema
);