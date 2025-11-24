const { execSync } = require('child_process');
require('dotenv').config({ path: '.env' });

try {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Try to construct DATABASE_URL from Supabase URL if possible
    // Supabase URL format: https://[project-ref].supabase.co
    // DB URL format: postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0];
        console.log('Project Ref:', projectRef);

        // Use the project ref to construct the DB URL, assuming the password is correct
        const dbUrl = `postgresql://postgres:D168681d123!@db.${projectRef}.supabase.co:5432/postgres`;
        console.log('Constructed DB URL:', dbUrl);

        process.env.DATABASE_URL = dbUrl;
        console.log('Running prisma db push...');
        execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
    } else {
        console.error('NEXT_PUBLIC_SUPABASE_URL not found');
    }

} catch (error) {
    console.error('Failed to run prisma db push', error);
    process.exit(1);
}
