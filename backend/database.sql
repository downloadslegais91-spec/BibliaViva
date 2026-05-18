-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS `bibliaviva` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bibliaviva`;

-- Desabilitar chaves estrangeiras temporariamente para evitar conflitos na criação
SET FOREIGN_KEY_CHECKS = 0;

-- Drop de tabelas se já existirem
DROP TABLE IF EXISTS `AiChatHistory`;
DROP TABLE IF EXISTS `UserQuest`;
DROP TABLE IF EXISTS `Quest`;
DROP TABLE IF EXISTS `ReadingProgress`;
DROP TABLE IF EXISTS `User`;

-- Reabilitar chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Tabela User
CREATE TABLE `User` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `xp` INT DEFAULT 0,
  `level` INT DEFAULT 1,
  `streakDays` INT DEFAULT 0,
  `lastAccess` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela ReadingProgress
CREATE TABLE `ReadingProgress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `book` VARCHAR(191) NOT NULL,
  `chapter` INT NOT NULL,
  `verses` JSON NOT NULL,
  `completed` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `ReadingProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela Quest
CREATE TABLE `Quest` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `xpReward` INT NOT NULL,
  `goal` INT NOT NULL,
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela UserQuest
CREATE TABLE `UserQuest` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `questId` INT NOT NULL,
  `progress` INT DEFAULT 0,
  `completed` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `UserQuest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  CONSTRAINT `UserQuest_questId_fkey` FOREIGN KEY (`questId`) REFERENCES `Quest` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela AiChatHistory
CREATE TABLE `AiChatHistory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `sender` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `AiChatHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- CARGA INICIAL DE DADOS (Real Seed Data)
-- --------------------------------------------------------

-- Inserindo o Usuário Padrão (id = 1)
INSERT INTO `User` (`id`, `name`, `email`, `xp`, `level`, `streakDays`, `lastAccess`, `createdAt`, `updatedAt`)
VALUES (1, 'Discípulo Fiel', 'usuario@bibliaviva.com.br', 0, 1, 0, NOW(), NOW(), NOW());

-- Inserindo Quests Padrões
INSERT INTO `Quest` (`id`, `type`, `title`, `description`, `xpReward`, `goal`, `createdAt`)
VALUES 
(1, 'daily', 'Mateus Completo', 'Leia os 28 capítulos de Mateus', 500, 28, NOW()),
(2, 'daily', 'Quiz: Mateus 1-4', 'Complete o primeiro quiz com 100% de acerto', 150, 1, NOW()),
(3, 'weekly', 'Devocional Diário', 'Leia pelo menos 1 capítulo por dia durante 7 dias seguidos', 300, 7, NOW()),
(4, 'challenge', 'Explorador dos Evangelhos', 'Leia Mateus, Marcos, Lucas e João', 1000, 4, NOW());

-- Associando Missões ao Usuário Principal (zeradas)
INSERT INTO `UserQuest` (`userId`, `questId`, `progress`, `completed`, `createdAt`, `updatedAt`)
VALUES 
(1, 1, 0, 0, NOW(), NOW()), -- Mateus completo: leu 0 capítulos de 28
(1, 2, 0, 0, NOW(), NOW()),  -- Quiz pendente
(1, 3, 0, 0, NOW(), NOW()),  -- Devocional semanal: 0 dias de 7
(1, 4, 0, 0, NOW(), NOW());  -- Leu 0 evangelhos de 4

-- Inserindo Algum Progresso de Leitura do Usuário (Começa vazio)

-- Histórico de Chat da IA de exemplo (Começa vazio)

