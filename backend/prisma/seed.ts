import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Academic", slug: "academic", icon: "📚" },
  { name: "Technical", slug: "technical", icon: "💻" },
  { name: "Leadership", slug: "leadership", icon: "🎯" },
  { name: "Volunteering", slug: "volunteering", icon: "🤝" },
  { name: "Competition", slug: "competition", icon: "🏆" },
  { name: "Workshop", slug: "workshop", icon: "🛠️" },
  { name: "Attendance", slug: "attendance", icon: "📅" },
  { name: "Participation", slug: "participation", icon: "🙋" },
  { name: "Other", slug: "other", icon: "✨" },
];

async function main() {
  for (const c of categories) {
    await prisma.achievementCategory.upsert({
      where: { slug: c.slug },
      create: { ...c, description: `${c.name} achievements` },
      update: { name: c.name, icon: c.icon, isActive: true },
    });
  }
  console.log("Seeded achievement categories");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
