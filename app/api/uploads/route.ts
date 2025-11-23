import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data: uploads, error } = await supabase
            .from('Upload')
            .select(`
                *,
                user:User (username),
                likes:Like (
                    *,
                    user:User (username)
                ),
                comments:Comment (
                    *,
                    user:User (username)
                )
            `)
            .order('createdAt', { ascending: false });

        if (error) throw error;

        // Sort comments manually if needed, or rely on Supabase order if I can specify it in nested select (Supabase JS client supports it but it's tricky in string syntax).
        // Let's just return as is, or sort in JS.
        if (uploads) {
            uploads.forEach((upload: any) => {
                if (upload.comments) {
                    upload.comments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                }
            });
        }

        return Response.json({ success: true, uploads });
    } catch (error) {
        console.error("Fetch uploads error:", error);
        return Response.json({ success: false, message: "Failed to fetch uploads" }, { status: 500 });
    }
}
