import { PrismaClient } from '../shared/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Initialize the connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 2. Initialize the client
const prisma = new PrismaClient({ adapter });

async function main() {
  const jsonPath = path.join(__dirname, 'expert_validation_356_records.json');
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found at: ${jsonPath}`);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log("🧹 Step 1: Cleaning existing data...");
  
  // We use a transaction to ensure all-or-nothing cleanup
  // Order is critical: Delete relations (child) before main records (parent)
  await prisma.$transaction([
    prisma.assignment.deleteMany({}),
    prisma.evaluation.deleteMany({}),
    prisma.dataset.deleteMany({}),
  ]);

  console.log("✨ Database wiped clean.");
  console.log(`🚀 Step 2: Seeding ${data.length} records...`);

  // Using a for-of loop for sequential, stable insertion
  for (const item of data) {
    try {
      await prisma.dataset.create({
        data: {
          id: String(item.id),
          title: item.title || "Untitled",
          description: item.description || "",
          url: item.url || null,
          keywords: item.keywords 
            ? (Array.isArray(item.keywords) 
                ? item.keywords 
                : item.keywords.split(',').map((k: string) => k.trim())) 
            : [],
          fileExtensions: item.file_types || [],
          authorAffiliation: item.source_id || "Unknown",
          sourceReposityId: item.source || "Unknown",
          evaluationCount: 0, // Ensure counter starts at zero
        },
      });
    } catch (err) {
      console.error(`❌ Failed to insert record ID ${item.id}:`, err);
    }
  }

  console.log("✅ Success! Database is fresh and ready for survey assignments.");
}

main()
  .catch((e) => {
    console.error("❌ Global Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });