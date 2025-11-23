import { supabase } from "@/lib/supabase";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { username } = await request.json();
        const uploadId = parseInt(params.id);

        if (!username || isNaN(uploadId)) {
            console.error("Invalid input:", { username, uploadId, paramId: params.id });
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

        // Check if already liked
        const { data: existingLike, error: likeError } = await supabase
            .from('Like')
            .select('id')
            .eq('userId', user.id)
            .eq('uploadId', uploadId)
            .single();

        if (existingLike) {
            // Unlike
            await supabase
                .from('Like')
                .delete()
                .eq('id', existingLike.id);
            return Response.json({ success: true, liked: false });
        } else {
            // Like
            await supabase
                .from('Like')
                .insert([
                    { userId: user.id, uploadId }
                ]);
            return Response.json({ success: true, liked: true });
        }

    } catch (error) {
        console.error("Like error details:", error);
        return Response.json({ success: false, message: "Failed to toggle like. Check server logs." }, { status: 500 });
    }
}
