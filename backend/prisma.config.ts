import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Use env() to require DATABASE_URL when running migrate commands.
    // If you need optional behavior for commands like `prisma generate`,
    // use `process.env.DATABASE_URL` instead.
    url: env('DATABASE_URL'),
  },
});
