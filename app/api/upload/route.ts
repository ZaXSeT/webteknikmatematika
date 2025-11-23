import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, url, type, title, description, media } = body;

        if ((!url && (!media || media.length === 0)) || !username) {
            return Response.json({ success: false, message: "Missing media or username" }, { status: 400 });
        }

        // Find user
        const { data: user, error: userError } = await supabase
            .from('User')
            .select('id')
            .eq('username', username)
            .single();

        if (userError || !user) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Save to DB
        const { data: upload, error: dbError } = await supabase
            .from('Upload')
            .insert([
                {
                    url: url || (media && media[0]?.url),
                    type: type || (media && media[0]?.type),
                    title,
                    description,
                    media,
                    userId: user.id
                }
            ])
            .select()
            .single();

        if (dbError) {
            throw dbError;
        }

        return Response.json({ success: true, upload });

    } catch (error: any) {
        console.error("Upload error:", error);
        return Response.json({ success: false, message: error.message || "Upload failed" }, { status: 500 });
    }
}
