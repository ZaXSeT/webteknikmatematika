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
        // WORKAROUND: Since we can't run migrations to add a 'media' column without DATABASE_URL,
        // we will store the media array as a JSON string in the 'url' column and set type to 'gallery'.

        let finalUrl = url;
        let finalType = type;

        if (media && media.length > 0) {
            finalUrl = JSON.stringify(media);
            finalType = 'gallery';
        } else {
            // Fallback for single file upload if media array is not used but url/type are passed directly
            finalUrl = url || (media && media[0]?.url);
            finalType = type || (media && media[0]?.type);
        }

        const { data: upload, error: dbError } = await supabase
            .from('Upload')
            .insert([
                {
                    url: finalUrl,
                    type: finalType,
                    title,
                    description,
                    // media, // Removing this as the column doesn't exist
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
