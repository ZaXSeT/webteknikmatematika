import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, nim, password } = body;

        // Check if user exists
        let { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('username', username)
            .single();

        // If user doesn't exist, check if it's the admin/default user credentials to create it
        if (!user) {
            if (username === "zackysetiawan" && nim === "03082240021" && password === "D0021d123") {
                const hashedPassword = await bcrypt.hash(password, 10);
                const { data: newUser, error: createError } = await supabase
                    .from('User')
                    .insert([
                        { username, nim, password: hashedPassword }
                    ])
                    .select()
                    .single();

                if (createError) throw createError;
                user = newUser;
            } else {
                return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
            }
        }

        // Verify credentials
        if (user.nim !== nim) {
            return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Fallback for legacy plain text passwords (auto-migrate)
        if (!isPasswordValid && user.password === password) {
            const newHashedPassword = await bcrypt.hash(password, 10);
            await supabase.from('User').update({ password: newHashedPassword }).eq('id', user.id);
            return NextResponse.json({ success: true, username: user.username });
        }

        if (isPasswordValid) {
            return NextResponse.json({ success: true, username: user.username });
        } else {
            return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
        }
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
