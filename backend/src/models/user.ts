import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;

    // Google authentication
    googleId?: string;
    authProvider: "local" | "google";

    // Email verification
    emailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        // ================= GOOGLE =================

        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        // ================= EMAIL VERIFICATION =================

        emailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationToken: {
            type: String,
        },

        emailVerificationExpires: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IUser>("User", userSchema);