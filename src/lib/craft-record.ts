import { crafts } from "@/data/crafts";
import { prisma } from "@/lib/prisma";

export async function ensureCraftRecord(slug: string) {
  const craft = crafts.find(item => item.slug === slug);
  if (!craft) return null;

  const category = await prisma.handicraftCategory.upsert({
    where: { name: craft.category },
    create: { name: craft.category },
    update: {},
  });
  const record = await prisma.handicraft.upsert({
    where: { slug: craft.slug },
    create: {
      slug: craft.slug,
      name: craft.name,
      state: craft.state,
      region: craft.region,
      description: craft.description,
      categoryId: category.id,
    },
    update: {},
  });
  await prisma.gIInformation.upsert({
    where: { handicraftId: record.id },
    create: {
      handicraftId: record.id,
      status: craft.giStatus === "GI registered" ? "REGISTERED" : "UNVERIFIED",
      origin: `${craft.region}, ${craft.state}`,
      history: craft.description,
    },
    update: {},
  });
  return record;
}
