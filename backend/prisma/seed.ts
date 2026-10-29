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

/** Display metadata only — CAMP/achievements still come from Sepolia + indexer. */
const demoStudentProfiles = [
  {
    walletAddress: "0xfd14a15d308627804a9044e12088838f47a45d2e",
    name: "Sakshi",
    department: "Computer Science",
    year: 3,
    bio: "Campus Reputation demo student profile.",
  },
  {
    walletAddress: "0xc4cbd1734f69899aadcc77527a0b5801f95f816e",
    name: "Jashwanth",
    department: "Computer Science",
    year: 3,
    bio: "Campus Reputation demo student profile.",
  },
];

const demoTeacherProfiles = [
  {
    walletAddress: "0x8b4e61b525376cd9e85f7b846453610e963c1ec7",
    name: "Bhavana",
    department: "Computer Science",
    designation: "Faculty",
  },
  {
    walletAddress: "0x5cdcdb9b9869f53ebbcdb22cb7e80fb915d0093c",
    name: "Akhil",
    department: "Computer Science",
    designation: "Faculty",
  },
  {
    walletAddress: "0x2ab4d7c729e2f6937d40becbf346fd1e8592fc1",
    name: "Subbu",
    department: "Administration",
    designation: "Contract owner",
  },
  {
    walletAddress: "0xf8cf0cdd71ae7032bb52fda88b91e98a03d068ed",
    name: "Satvika",
    department: "Computer Science",
    designation: "Faculty",
  },
];

export async function runSeed() {
  for (const c of categories) {
    await prisma.achievementCategory.upsert({
      where: { slug: c.slug },
      create: { ...c, description: `${c.name} achievements` },
      update: { name: c.name, icon: c.icon, isActive: true },
    });
  }
  console.log("Seeded achievement categories");

  for (const p of demoStudentProfiles) {
    await prisma.studentProfile.upsert({
      where: { walletAddress: p.walletAddress },
      create: { ...p, isPublic: true },
      update: {
        name: p.name,
        department: p.department,
        year: p.year,
        bio: p.bio,
        isPublic: true,
      },
    });
    await prisma.userPreference.upsert({
      where: { walletAddress: p.walletAddress },
      create: { walletAddress: p.walletAddress },
      update: {},
    });
  }
  console.log("Seeded demo student profiles (metadata only)");

  for (const t of demoTeacherProfiles) {
    await prisma.teacherProfile.upsert({
      where: { walletAddress: t.walletAddress },
      create: t,
      update: {
        name: t.name,
        department: t.department,
        designation: t.designation,
      },
    });
  }
  console.log("Seeded demo teacher profiles (metadata only)");
}

runSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
