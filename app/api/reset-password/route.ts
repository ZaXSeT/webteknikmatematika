import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json({ success: false, message: "Missing token or password" }, { status: 400 });
        }

        // Find user with valid token
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('resetToken', token)
            .single();

        if (error || !user) {
            return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 400 });
        }

        // Check expiry
        if (new Date(user.resetTokenExpiry) < new Date()) {
            return NextResponse.json({ success: false, message: "Token expired" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        const { error: updateError } = await supabase
            .from('User')
            .update({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            })
            .eq('id', user.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, message: "Password updated successfully" });

    } catch (error: any) {
        console.error("Reset password error:", error);
        return NextResponse.json({ success: false, message: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
