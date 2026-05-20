import prisma from './prisma';

async function normalizeEmails() {
  try {
    console.log("=== STARTING DATABASE EMAIL NORMALIZATION ===");
    
    // 1. Delete users with invalid placeholder email 'undefined' or empty
    const deletedInvalid = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'undefined' },
          { email: '' }
        ]
      }
    });
    if (deletedInvalid.count > 0) {
      console.log(`Deleted ${deletedInvalid.count} user(s) with invalid/undefined email placeholder.`);
    }

    // 2. Fetch all remaining users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} total user(s) to inspect.`);

    for (const user of users) {
      const originalEmail = user.email;
      const normalizedEmail = originalEmail.trim().toLowerCase();

      // If email is already normalized, skip
      if (originalEmail === normalizedEmail) {
        continue;
      }

      console.log(`Normalizing user ID ${user.id}: "${originalEmail}" -> "${normalizedEmail}"`);

      // Check if another user already exists with the normalized email
      const duplicateUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: user.id }
        }
      });

      if (duplicateUser) {
        console.log(`Found duplicate user ID ${duplicateUser.id} with email "${normalizedEmail}". Merging data...`);
        
        // Merge progress: keep the duplicateUser (since its email is already lowercase/correctly formatted)
        // and transfer progress from 'user' (current mixed-case user) to 'duplicateUser', then delete 'user'.
        
        // Transfer XP, Level, Streak (keep maximums)
        await prisma.user.update({
          where: { id: duplicateUser.id },
          data: {
            xp: Math.max(duplicateUser.xp, user.xp),
            level: Math.max(duplicateUser.level, user.level),
            streakDays: Math.max(duplicateUser.streakDays, user.streakDays),
          }
        });

        // Merge ReadingProgress (move progress records to duplicateUser, ignoring unique constraint failures by catching them)
        const progressRecords = await prisma.readingProgress.findMany({
          where: { userId: user.id }
        });

        for (const record of progressRecords) {
          try {
            // Check if duplicateUser already has progress for this chapter
            const exists = await prisma.readingProgress.findFirst({
              where: {
                userId: duplicateUser.id,
                book: record.book,
                chapter: record.chapter
              }
            });

            if (!exists) {
              await prisma.readingProgress.update({
                where: { id: record.id },
                data: { userId: duplicateUser.id }
              });
            } else {
              // Delete duplicate progress
              await prisma.readingProgress.delete({
                where: { id: record.id }
              });
            }
          } catch (err) {
            console.error(`Error merging reading progress record ${record.id}:`, err);
          }
        }

        // Merge UserQuest
        const questRecords = await prisma.userQuest.findMany({
          where: { userId: user.id }
        });

        for (const record of questRecords) {
          try {
            const exists = await prisma.userQuest.findFirst({
              where: {
                userId: duplicateUser.id,
                questId: record.questId
              }
            });

            if (!exists) {
              await prisma.userQuest.update({
                where: { id: record.id },
                data: { userId: duplicateUser.id }
              });
            } else {
              // If duplicate exists, keep the one that is completed or has more progress
              if (record.completed && !exists.completed) {
                await prisma.userQuest.update({
                  where: { id: exists.id },
                  data: {
                    completed: true,
                    progress: record.progress
                  }
                });
              }
              await prisma.userQuest.delete({
                where: { id: record.id }
              });
            }
          } catch (err) {
            console.error(`Error merging quest record ${record.id}:`, err);
          }
        }

        // Merge AiChatHistory
        try {
          await prisma.aiChatHistory.updateMany({
            where: { userId: user.id },
            data: { userId: duplicateUser.id }
          });
        } catch (err) {
          console.error(`Error merging chat history for user ${user.id}:`, err);
        }

        // Finally delete the mixed-case user
        await prisma.user.delete({
          where: { id: user.id }
        });
        console.log(`Merged and deleted duplicate user ID ${user.id}.`);
      } else {
        // No duplicate, just update the email to lowercase
        await prisma.user.update({
          where: { id: user.id },
          data: { email: normalizedEmail }
        });
        console.log(`Updated email to lowercase for user ID ${user.id}.`);
      }
    }

    console.log("=== DATABASE EMAIL NORMALIZATION COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Error during email normalization:", error);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeEmails();
