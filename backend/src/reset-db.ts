import prisma from './prisma';

async function resetDb() {
  console.log('🤖 Starting database reset and seed...');

  // 1. Delete all existing records (respecting foreign keys in order)
  console.log('🧹 Clearing existing tables...');
  await prisma.aiChatHistory.deleteMany({});
  await prisma.userQuest.deleteMany({});
  await prisma.readingProgress.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.quest.deleteMany({});

  // 2. Create the default user
  console.log('👤 Seeding default user with 0 progress...');
  await prisma.user.create({
    data: {
      id: 1,
      name: 'Discípulo Fiel',
      email: 'usuario@bibliaviva.com.br',
      xp: 0,
      level: 1,
      streakDays: 0,
    },
  });

  // 3. Create quests
  console.log('📜 Seeding default quests definitions...');
  const questsData = [
    {
      id: 1,
      type: 'daily',
      title: 'Mateus Completo',
      description: 'Leia os 28 capítulos de Mateus',
      xpReward: 500,
      goal: 28,
    },
    {
      id: 2,
      type: 'daily',
      title: 'Quiz: Mateus 1-4',
      description: 'Complete o primeiro quiz com 100% de acerto',
      xpReward: 150,
      goal: 1,
    },
    {
      id: 3,
      type: 'weekly',
      title: 'Devocional Diário',
      description: 'Leia pelo menos 1 capítulo por dia durante 7 dias seguidos',
      xpReward: 300,
      goal: 7,
    },
    {
      id: 4,
      type: 'challenge',
      title: 'Explorador dos Evangelhos',
      description: 'Leia Mateus, Marcos, Lucas e João',
      xpReward: 1000,
      goal: 4,
    },
  ];

  for (const q of questsData) {
    await prisma.quest.create({ data: q });
  }

  // 4. Create user-quest links starting at 0 progress
  console.log('⚔️ Seeding default user-quests associations with 0 progress...');
  const userQuestsData = [
    { userId: 1, questId: 1, progress: 0, completed: false },
    { userId: 1, questId: 2, progress: 0, completed: false },
    { userId: 1, questId: 3, progress: 0, completed: false },
    { userId: 1, questId: 4, progress: 0, completed: false },
  ];

  for (const uq of userQuestsData) {
    await prisma.userQuest.create({ data: uq });
  }

  console.log('✨ Database reset completed successfully!');
}

resetDb()
  .catch((e) => {
    console.error('❌ Error resetting database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
