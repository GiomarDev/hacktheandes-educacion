// Crea la base `school` si no existe. Se ejecuta una sola vez: npm run db:create
import 'dotenv/config';
import pg from 'pg';

const url = process.env.ADMIN_DATABASE_URL;
if (!url) throw new Error('Falta la variable de entorno ADMIN_DATABASE_URL');

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['school']);
  if (rowCount) {
    console.log('school: ya existía');
  } else {
    await client.query('CREATE DATABASE school');
    console.log('school: creada');
  }
} finally {
  await client.end();
}
