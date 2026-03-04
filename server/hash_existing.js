const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function hashAll() {
  const { rows } = await pool.query('SELECT user_id, password FROM userlogin');
  for (const user of rows) {
    if (user.password.startsWith('$2b$')) {
      console.log(`user_id ${user.user_id} — already hashed, skipping`);
      continue;
    }
    const hashed = await bcrypt.hash(user.password, 10);
    await pool.query(
      'UPDATE userlogin SET password = $1, is_default_password = TRUE WHERE user_id = $2',
      [hashed, user.user_id]
    );
    console.log(`Hashed user_id ${user.user_id} — was: ${user.password}`);
  }
  console.log('Done.');
  pool.end();
}

hashAll();