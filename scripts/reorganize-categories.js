const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const targetCategories = [
  { name: "Jeux", group: "AMBIANCE_SON", sortOrder: 10 },
  { name: "Sonorisation", group: "AMBIANCE_SON", sortOrder: 20 },
  { name: "Lumières et projecteur", group: "AMBIANCE_SON", sortOrder: 30 },
  { name: "Matériel de table", group: "MATERIEL_SERVICE", sortOrder: 40 },
  { name: "Réception", group: "MATERIEL_SERVICE", sortOrder: 50 },
  { name: "Électrique matériel", group: "MATERIEL_SERVICE", sortOrder: 60 },
  { name: "Lanternes et lumières", group: "DECORATION", sortOrder: 70 },
  { name: "Linge de table et chaise", group: "DECORATION", sortOrder: 80 },
  { name: "Photophores et chandelier", group: "DECORATION", sortOrder: 90 },
  { name: "Vases et soliflores", group: "DECORATION", sortOrder: 100 },
  { name: "Arches", group: "DECORATION", sortOrder: 110 },
  { name: "Divers déco", group: "DECORATION", sortOrder: 120 },
  { name: "Décoration vintage", group: "DECORATION", sortOrder: 130 },
];

const categoryAliasMap = {
  Ambiance: "Sonorisation",
  Electroménager: "Électrique matériel",
  "Décoration": "Divers déco",
  Mobilier: "Réception",
  Vaisselle: "Matériel de table",
};

function getTargetCategoryName(itemName, currentCategoryName) {
  const normalized = itemName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (/jeu|baby|casino|animation/.test(normalized)) return "Jeux";
  if (/enceinte|tour de son|sono|micro|haut parleur/.test(normalized)) return "Sonorisation";
  if (/lumiere|lumiere|projecteur|led|guirlande/.test(normalized)) return "Lumières et projecteur";
  if (/assiette|verre|couvert|plat|vaisselle/.test(normalized)) return "Matériel de table";
  if (/table|banc|mange-debout|mange debout|reception|chaise(?!.*housse)/.test(normalized)) return "Réception";
  if (/tireuse|percolateur|broyeur|riz|machine|electrique|chauffe/.test(normalized)) return "Électrique matériel";
  if (/nappe|housse|linge|serviette|chemin de table/.test(normalized)) return "Linge de table et chaise";
  if (/lanterne|guirlande/.test(normalized)) return "Lanternes et lumières";
  if (/photophore|chandelier|bougeoir/.test(normalized)) return "Photophores et chandelier";
  if (/vase|soliflore/.test(normalized)) return "Vases et soliflores";
  if (/arche/.test(normalized)) return "Arches";
  if (/vintage/.test(normalized)) return "Décoration vintage";

  return categoryAliasMap[currentCategoryName] || "Divers déco";
}

async function main() {
  for (const target of targetCategories) {
    await prisma.itemCategory.upsert({
      where: { name: target.name },
      update: {
        group: target.group,
        sortOrder: target.sortOrder,
      },
      create: target,
    });
  }

  const categories = await prisma.itemCategory.findMany();
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  for (const [oldName, newName] of Object.entries(categoryAliasMap)) {
    const oldCategory = categoryByName.get(oldName);
    const targetCategory = categoryByName.get(newName);
    if (!oldCategory || !targetCategory || oldCategory.id === targetCategory.id) continue;

    await prisma.item.updateMany({
      where: { categoryId: oldCategory.id },
      data: { categoryId: targetCategory.id },
    });

    const remaining = await prisma.item.count({ where: { categoryId: oldCategory.id } });
    if (remaining === 0) {
      await prisma.itemCategory.delete({ where: { id: oldCategory.id } });
    }
  }

  const refreshedCategories = await prisma.itemCategory.findMany();
  const refreshedMap = new Map(refreshedCategories.map((category) => [category.name, category.id]));
  const items = await prisma.item.findMany({ include: { category: true } });

  for (const item of items) {
    const targetName = getTargetCategoryName(item.name, item.category?.name || "");
    const targetId = refreshedMap.get(targetName);
    if (!targetId || item.categoryId === targetId) continue;

    await prisma.item.update({
      where: { id: item.id },
      data: { categoryId: targetId },
    });
  }

  const targetNames = new Set(targetCategories.map((category) => category.name));
  const cleanupCategories = await prisma.itemCategory.findMany({
    include: { _count: { select: { items: true } } },
  });

  for (const category of cleanupCategories) {
    if (targetNames.has(category.name)) continue;
    if (category._count.items > 0) continue;
    await prisma.itemCategory.delete({ where: { id: category.id } });
  }

  const finalCategories = await prisma.itemCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  console.log(
    JSON.stringify(
      finalCategories.map((category) => ({
        name: category.name,
        group: category.group,
        items: category._count.items,
      })),
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
