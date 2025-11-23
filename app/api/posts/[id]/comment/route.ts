import { supabase } from "@/lib/supabase";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { username, text } = await request.json();
        const uploadId = parseInt(params.id);

        if (!username || !text || isNaN(uploadId)) {
            console.error("Invalid input:", { username, text, uploadId, paramId: params.id });
            return Response.json({ success: false, message: "Invalid input" }, { status: 400 });
        }

        const { data: user, error: userError } = await supabase
            .from('User')
            .select('id')
            .eq('username', username)
            .single();

        if (userError || !user) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const { data: comment, error: commentError } = await supabase
            .from('Comment')
            .insert([
                {
                    text,
                    userId: user.id,
                    uploadId
                }
            ])
            .select('*, user:User(username)')
            .single();

        if (commentError) {
            throw commentError;
        }

        return Response.json({ success: true, comment });

    } catch (error) {
        console.error("Comment error:", error);
        return Response.json({ success: false, message: "Failed to post comment" }, { status: 500 });
    }
}
