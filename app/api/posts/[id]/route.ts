import { supabase } from "@/lib/supabase";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { username } = await request.json();
        const uploadId = parseInt(params.id);

        if (!username || isNaN(uploadId)) {
            return Response.json({ success: false, message: "Invalid input" }, { status: 400 });
        }

        // Fetch post to check ownership
        const { data: upload, error: fetchError } = await supabase
            .from('Upload')
            .select('*, user:User(username)')
            .eq('id', uploadId)
            .single();

        if (fetchError || !upload) {
            return Response.json({ success: false, message: "Post not found" }, { status: 404 });
        }

        // Check permission
        if (upload.user.username !== username && username !== 'zackysetiawan') {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        // Delete file from Supabase Storage if it exists
        if (upload.url && upload.url.includes('supabase.co')) {
            const urlParts = upload.url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            if (fileName) {
                await supabase.storage
                    .from('uploads')
                    .remove([fileName]);
            }
        }

        // Delete from DB
        const { error: deleteError } = await supabase
            .from('Upload')
            .delete()
            .eq('id', uploadId);

        if (deleteError) throw deleteError;

        return Response.json({ success: true });

    } catch (error: any) {
        console.error("Delete error:", error);
        return Response.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { username, title, description } = await request.json();
        const uploadId = parseInt(params.id);

        if (!username || isNaN(uploadId)) {
            return Response.json({ success: false, message: "Invalid input" }, { status: 400 });
        }

        // Fetch post to check ownership
        const { data: upload, error: fetchError } = await supabase
            .from('Upload')
            .select('*, user:User(username)')
            .eq('id', uploadId)
            .single();

        if (fetchError || !upload) {
            return Response.json({ success: false, message: "Post not found" }, { status: 404 });
        }

        // Check permission
        if (upload.user.username !== username && username !== 'zackysetiawan') {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 403 });
        }

        // Update
        const { error: updateError } = await supabase
            .from('Upload')
            .update({ title, description })
            .eq('id', uploadId);

        if (updateError) throw updateError;

        return Response.json({ success: true });

    } catch (error: any) {
        console.error("Update error:", error);
        return Response.json({ success: false, message: error.message }, { status: 500 });
    }
}
