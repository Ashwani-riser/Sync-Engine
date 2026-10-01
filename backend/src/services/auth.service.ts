import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user";

interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
}

interface LoginUserInput {
    email: string;
    password: string;
}

// ================= REGISTER =================

export const registerUser = async ({
    name,
    email,
    password,
}: RegisterUserInput) => {

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    return user;
};


// ================= LOGIN =================

export const loginUser = async ({
    email,
    password,
}: LoginUserInput) => {

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // Generate JWT
    const token = jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "7d",
        }
    );

    return {
        user,
        token,
    };
};
export const getUserById = async (userId: string) => {
    const user = await User.findById(userId).select("-password");

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};