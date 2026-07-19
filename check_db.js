import { prisma } from './lib/db.js';

async function run() {
    const sites = await prisma.site.findMany();
    console.log("SITES:", JSON.stringify(sites, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
