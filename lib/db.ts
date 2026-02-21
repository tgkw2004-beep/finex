import { Pool } from 'pg';

// Create a single pool instance to be shared across API routes
// This prevents creating a new connection for every single request
const pool = new Pool({
    connectionString: process.env.REMOTE_DB_URL,
    // Add connection pooling configurations for better performance under load
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // how long to wait for a new connection
});

// Set schema so we don't have to specify remote_market.xxx or remote_visual.xxx
pool.on('connect', (client) => {
    client.query(`SET search_path TO public, remote_market, remote_visual, remote_company`);
});

// Helper to reliably ping/test the connection
export async function testConnection() {
    try {
        const client = await pool.connect();
        client.release();
        return true;
    } catch (error) {
        console.error('Failed to connect to direct DB:', error);
        return false;
    }
}

export default pool;
