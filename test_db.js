import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env' });
const prisma = new PrismaClient();

async function run() {
    const sites = await prisma.site.findMany();
    console.log("Sites in DB:", JSON.stringify(sites, null, 2));
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
