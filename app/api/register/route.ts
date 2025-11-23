import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, nim, password } = body;

        if (!username || !nim || !password) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('User')
            .select('*')
            .eq('username', username)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Username already taken" },
                { status: 409 }
            );
        }

        // Create user
        const { data: newUser, error: insertError } = await supabase
            .from('User')
            .insert([
                { username, nim, password }
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
