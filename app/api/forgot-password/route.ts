import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, nim } = body;

        if (!username || !nim) {
            return NextResponse.json({ success: false, message: "Missing username or NIM" }, { status: 400 });
        }

        // Find user
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('username', username)
            .eq('nim', nim)
            .single();

        if (error || !user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save to DB
        const { error: updateError } = await supabase
            .from('User')
            .update({ resetToken, resetTokenExpiry: resetTokenExpiry.toISOString() })
            .eq('id', user.id);
        if (updateError) {
            throw updateError;
        }

        // Mock Email Construction
        // If user has an email in DB, use it. Otherwise, construct a mock one.
        const userEmail = user.email || `${username.substring(0, 3)}***@student.upj.ac.id`;

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?resetToken=${resetToken}`;

        console.log(`[MOCK EMAIL] To: ${userEmail} (User: ${username}) - Reset Link: ${resetLink}`);

        return NextResponse.json({
            success: true,
            message: `Authentication link sent to ${userEmail}`,
            // We return the link here for testing purposes since we can't actually send email
            debugLink: resetLink
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
