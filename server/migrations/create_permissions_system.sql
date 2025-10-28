-- =====================================================
-- SISTEMA DE PERMISSÕES - MIRAI REACT
-- =====================================================
-- Data: 28/10/2025
-- Descrição: Criação de tabelas para sistema flexível de permissões
-- =====================================================

-- 1. Tabela de permissões disponíveis no sistema
CREATE TABLE IF NOT EXISTS `permissoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nome único da permissão (ex: admin, comercial, tecnico)',
  `descricao` VARCHAR(255) COMMENT 'Descrição do que essa permissão permite',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de relacionamento entre cargos e permissões (muitos para muitos)
CREATE TABLE IF NOT EXISTS `cargo_permissoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cargo_id` INT NOT NULL,
  `permissao_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permissao_id`) REFERENCES `permissoes` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_cargo_permissao` (`cargo_id`, `permissao_id`),
  INDEX `idx_cargo_id` (`cargo_id`),
  INDEX `idx_permissao_id` (`permissao_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERIR PERMISSÕES PADRÃO
-- =====================================================

INSERT INTO `permissoes` (`nome`, `descricao`) VALUES
('admin', 'Acesso administrativo completo - gerenciar usuários, configurações e todos os módulos'),
('comercial', 'Acesso ao módulo comercial - propostas, itens comerciais, relatórios comerciais'),
('tecnico', 'Acesso ao módulo técnico - tarefas, agenda, calendário, checklists');

-- =====================================================
-- MAPEAR CARGOS EXISTENTES PARA NOVAS PERMISSÕES
-- =====================================================
-- Nota: Ajuste os cargo_id conforme sua tabela de cargos

-- Admin (cargoId 1, 2, 3) -> permissão 'admin'
-- Assumindo que cargos 1, 2, 3 existem na tabela cargos
INSERT INTO `cargo_permissoes` (`cargo_id`, `permissao_id`)
SELECT c.id, p.id
FROM `cargos` c
CROSS JOIN `permissoes` p
WHERE c.id IN (1, 2, 3) AND p.nome = 'admin'
ON DUPLICATE KEY UPDATE cargo_id = cargo_id;

-- Comercial (cargoId 13) -> permissão 'comercial'
INSERT INTO `cargo_permissoes` (`cargo_id`, `permissao_id`)
SELECT c.id, p.id
FROM `cargos` c
CROSS JOIN `permissoes` p
WHERE c.id = 13 AND p.nome = 'comercial'
ON DUPLICATE KEY UPDATE cargo_id = cargo_id;

-- Técnico (cargoId 4, 5 e outros técnicos) -> permissão 'tecnico'
-- Ajuste os IDs conforme necessário
INSERT INTO `cargo_permissoes` (`cargo_id`, `permissao_id`)
SELECT c.id, p.id
FROM `cargos` c
CROSS JOIN `permissoes` p
WHERE c.id IN (4, 5) AND p.nome = 'tecnico'
ON DUPLICATE KEY UPDATE cargo_id = cargo_id;

-- =====================================================
-- ADMIN também tem acesso comercial e técnico
-- =====================================================
INSERT INTO `cargo_permissoes` (`cargo_id`, `permissao_id`)
SELECT c.id, p.id
FROM `cargos` c
CROSS JOIN `permissoes` p
WHERE c.id IN (1, 2, 3) AND p.nome IN ('comercial', 'tecnico')
ON DUPLICATE KEY UPDATE cargo_id = cargo_id;

-- =====================================================
-- VIEW ÚTIL: Ver permissões por usuário
-- =====================================================
CREATE OR REPLACE VIEW `vw_usuario_permissoes` AS
SELECT 
  u.id AS usuario_id,
  u.nome,
  u.email,
  c.id AS cargo_id,
  c.nome AS cargo_nome,
  p.id AS permissao_id,
  p.nome AS permissao_nome,
  p.descricao AS permissao_descricao
FROM `usuarios` u
INNER JOIN `cargos` c ON u.cargo_id = c.id
INNER JOIN `cargo_permissoes` cp ON c.id = cp.cargo_id
INNER JOIN `permissoes` p ON cp.permissao_id = p.id;

-- =====================================================
-- VIEW ÚTIL: Ver cargos e suas permissões
-- =====================================================
CREATE OR REPLACE VIEW `vw_cargo_permissoes` AS
SELECT 
  c.id AS cargo_id,
  c.nome AS cargo_nome,
  GROUP_CONCAT(p.nome ORDER BY p.nome SEPARATOR ', ') AS permissoes
FROM `cargos` c
LEFT JOIN `cargo_permissoes` cp ON c.id = cp.cargo_id
LEFT JOIN `permissoes` p ON cp.permissao_id = p.id
GROUP BY c.id, c.nome
ORDER BY c.id;

-- =====================================================
-- QUERIES ÚTEIS PARA VERIFICAÇÃO
-- =====================================================

-- Ver todas as permissões
-- SELECT * FROM permissoes;

-- Ver relacionamento cargo-permissão
-- SELECT c.nome AS cargo, p.nome AS permissao
-- FROM cargo_permissoes cp
-- INNER JOIN cargos c ON cp.cargo_id = c.id
-- INNER JOIN permissoes p ON cp.permissao_id = p.id
-- ORDER BY c.id, p.nome;

-- Ver permissões de um usuário específico
-- SELECT * FROM vw_usuario_permissoes WHERE usuario_id = 1;

-- Ver todos os cargos e suas permissões
-- SELECT * FROM vw_cargo_permissoes;
