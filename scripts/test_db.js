const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:D168681d123!@db.ubtdcaujsylsipratjfq.supabase.co:5432/postgres',
});

async function test() {
    try {
        await client.connect();
        console.log('Connected successfully');
        await client.end();
    } catch (err) {
        console.error('Connection error', err);
    }
}

test();
