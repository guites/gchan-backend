const { Pool } = require('pg');
const ssl_options = process.env.PORT == 5000 ? false : { rejectUnauthorized: false };
const connectionString = process.env.DATABASE_URL;
const db = new Pool({
    connectionString: connectionString,
    ssl: ssl_options
});

module.exports = db;
