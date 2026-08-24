import bcrypt from "bcrypt";
import User from "../models/user";

interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
}

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