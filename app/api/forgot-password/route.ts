import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import nodemailer from "nodemailer";

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

        // Determine Origin for Link
        const origin = 'https://web-teknik-matematika.vercel.app';
        const resetLink = `${origin}?resetToken=${resetToken}`;

        // Email Construction
        const userEmail = user.email || `${username.substring(0, 3)}***@student.upj.ac.id`;

        // Configure Nodemailer
        // NOTE: User must provide these env variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: '"TeknikMatematika System" <system@teknikmatematika.com>',
                to: user.email, // Only send to real email if it exists
                subject: "Password Reset Request",
                html: `
                    <div style="font-family: monospace; padding: 20px; background: #f4f4f4; border-radius: 8px;">
                        <h2 style="color: #333;">Password Reset Protocol</h2>
                        <p>User <strong>${username}</strong> has requested a password reset.</p>
                        <p>Click the secure link below to proceed:</p>
                        <a href="${resetLink}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">Reset Password</a>
                        <p style="font-size: 12px; color: #666; margin-top: 20px;">Link expires in 1 hour.</p>
                        <p style="font-size: 12px; color: #666;">If you did not initiate this request, ignore this message.</p>
                    </div>
                `,
            });

            console.log(`[EMAIL SENT] To: ${user.email}`);

            return NextResponse.json({
                success: true,
                message: `Authentication link sent to ${userEmail}`
            });

        } catch (emailError: any) {
            console.error("Email sending failed:", emailError);
            // If we can't send email, we might want to fallback or error out.
            // Since user requested "bukan dari terminal", we error out if email fails.
            // However, for testing without SMTP, we might still want to see it in console.
            console.log(`[FALLBACK LINK] ${resetLink}`);
            return NextResponse.json({ success: false, message: "Failed to send email. Check server logs." }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ success: false, message: `Internal server error: ${error.message}` }, { status: 500 });
    }
}
