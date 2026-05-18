import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/bibliaviva';

// Parse the DATABASE_URL connection string: mysql://user:password@host:port/database
const match = dbUrl.match(/mysql:\/\/([^:]*)(?::([^@]*))?@([^:\/]+)(?::(\d+))?\/(.+)/);

if (!match) {
  throw new Error('Invalid DATABASE_URL format. Must be: mysql://user:password@host:port/database');
}

const [, user, password, host, port, database] = match;

const adapter = new PrismaMariaDb({
  host: host,
  port: port ? parseInt(port, 10) : 3306,
  user: user,
  password: password || '',
  database: database,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
