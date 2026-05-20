import prisma from './prisma';

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            readingProgress: true,
            userQuests: true,
          }
        }
      }
    });
    console.log("=== DB USERS ===");
    console.log(JSON.stringify(users, null, 2));
    console.log("================");
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
