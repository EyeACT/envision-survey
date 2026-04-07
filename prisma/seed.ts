import { PrismaClient } from '../shared/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg'; // You likely have this installed
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Initialize the connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Initialize the client using the adapter as shown in your code's @example
const prisma = new PrismaClient({ adapter });

async function main() {
  const jsonPath = path.join(__dirname, 'expert_validation_356_records.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`🚀 Found ${data.length} records. Syncing to database...`);

  for (const item of data) {
    await prisma.dataset.upsert({
      where: { id: String(item.id) },
      update: {
        url: item.url || null, // Update if it exists
      },
      create: {
        id: String(item.id),
        title: item.title || "Untitled",
        description: item.description || "",
        url: item.url || null,
        keywords: item.keywords 
          ? (Array.isArray(item.keywords) ? item.keywords : item.keywords.split(',').map((k: string) => k.trim())) 
          : [],
        fileExtensions: item.file_types || [],
        authorAffiliation: item.source_id || "Unknown",
        sourceReposityId: item.source || "Unknown",
        evaluationCount: 0,
      },
    });
  }

  console.log("✅ Success! 356 records are now in the Dataset table.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Clean up the pg pool
  });