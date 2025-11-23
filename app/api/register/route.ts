import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const VALID_NIMS = [
    "03082240018", "03082240002", "03082240008", "03082240017", "03082240014",
    "03082240005", "03082240004", "03082240024", "03082240015", "03082240007",
    "03082240003", "03082240012", "03082240013", "03082240025", "03082240028",
    "03082240020", "03082240006", "03082240022", "03082240009"
];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, nim, email, password } = body;

        if (!username || !nim || !email || !password) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // 1. Validate NIM against allowed list
        if (!VALID_NIMS.includes(nim)) {
            return NextResponse.json(
                { success: false, message: "NIM is not in the valid database list." },
                { status: 400 }
            );
        }

        // 2. Check if username OR NIM already exists
        const { data: existingUsers, error: fetchError } = await supabase
            .from('User')
            .select('username, nim')
            .or(`username.eq.${username},nim.eq.${nim}`);

        if (fetchError) {
            throw fetchError;
        }

        if (existingUsers && existingUsers.length > 0) {
            const isUsernameTaken = existingUsers.some(u => u.username === username);
            const isNimTaken = existingUsers.some(u => u.nim === nim);

            if (isNimTaken) {
                return NextResponse.json(
                    { success: false, message: "This NIM is already registered." },
                    { status: 409 }
                );
            }
            if (isUsernameTaken) {
                return NextResponse.json(
                    { success: false, message: "Username already taken." },
                    { status: 409 }
                );
            }
        }

        // 3. Create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: newUser, error: insertError } = await supabase
            .from('User')
            .insert([
                { username, nim, email, password: hashedPassword }
            ])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({ success: true, user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
