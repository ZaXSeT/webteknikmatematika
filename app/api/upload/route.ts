import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const username = data.get('username') as string;
        const title = data.get('title') as string || "";
        const description = data.get('description') as string || "";

        if (!file || !username) {
            return Response.json({ success: false, message: "Missing file or username" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;

        // Upload to Supabase Storage
        // Ensure you have a bucket named 'uploads' in your Supabase Storage and it is set to Public.
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

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
                    url: publicUrl,
                    type: file.type,
                    title,
                    description,
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
