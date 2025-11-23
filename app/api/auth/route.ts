import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
                const { data: newUser, error: createError } = await supabase
                    .from('User')
                    .insert([
                        { username, nim, password }
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
        if (user.nim === nim && user.password === password) {
            return NextResponse.json({ success: true, username: user.username });
        } else {
            return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
        }
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
