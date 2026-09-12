/**
 * Add this to package.json:
 * "prisma": {
 *   "seed": "ts-node prisma/seed.ts"
 * }
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding cosmetic items...');

  const items = [
    { name: 'Cyberpunk Matrix', price: 100, cssClass: 'cyberpunk-matrix', type: 'theme', description: 'Enter the matrix with acid green.' },
    { name: 'Crimson Glitch', price: 150, cssClass: 'crimson-glitch', type: 'theme', description: 'Blood red glitch aesthetic.' },
    { name: 'Solar Gold', price: 200, cssClass: 'solar-gold', type: 'theme', description: 'Astral purple and gold royalty.' },
    { name: 'Entropy Defier', price: 50, cssClass: 'badge-entropy-defier', type: 'badge', description: 'Survived your first week without decay' },
    { name: 'Void Walker', price: 75, cssClass: 'badge-void-walker', type: 'badge', description: 'Banished a Shadow Entity' },
    { name: 'Chrono Master', price: 120, cssClass: 'title-chrono-master', type: 'title', description: 'Completed 10 Focus Sessions' },
  ];

  for (const item of items) {
    await prisma.cosmeticItem.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
