-- =====================================================
-- SISTEMA DE CONFIGURAÇÃO DE USUÁRIOS DA AGENDA
-- =====================================================
-- Data: 28/10/2025
-- Descrição: Permite configurar manualmente quais usuários
--            aparecem na página de Agenda, sem depender de cargoId
-- =====================================================

-- 1. Tabela para configurar visibilidade de usuários na agenda
CREATE TABLE IF NOT EXISTS `agenda_usuarios_visiveis` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL COMMENT 'ID do usuário que aparecerá na agenda',
  `unidade_id` INT NULL COMMENT 'Unidade específica (NULL = todas as unidades)',
  `ativo` TINYINT(1) DEFAULT 1 COMMENT '1 = visível, 0 = oculto',
  `ordem` INT DEFAULT 0 COMMENT 'Ordem de exibição (menor = primeiro)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_usuario_unidade` (`usuario_id`, `unidade_id`),
  INDEX `idx_usuario_id` (`usuario_id`),
  INDEX `idx_unidade_id` (`unidade_id`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MIGRAÇÃO AUTOMÁTICA: Adicionar usuários técnicos existentes
-- =====================================================
-- Adiciona automaticamente todos os usuários técnicos atuais
-- baseado na lógica antiga (cargoId 4, 5, etc)

INSERT INTO `agenda_usuarios_visiveis` (`usuario_id`, `unidade_id`, `ativo`, `ordem`)
SELECT DISTINCT
  u.id,
  uu.unidade_id,
  1,
  u.id -- ordem inicial = id do usuário
FROM `usuarios` u
INNER JOIN `usuario_unidades` uu ON u.id = uu.usuario_id
WHERE u.cargo_id IN (4, 5) -- Ajuste os IDs de cargos técnicos conforme necessário
  AND u.status = 'ativo'
ON DUPLICATE KEY UPDATE 
  ativo = 1,
  updated_at = CURRENT_TIMESTAMP;

-- Também adicionar para "todas as unidades" (NULL)
INSERT INTO `agenda_usuarios_visiveis` (`usuario_id`, `unidade_id`, `ativo`, `ordem`)
SELECT DISTINCT
  u.id,
  NULL,
  1,
  u.id
FROM `usuarios` u
WHERE u.cargo_id IN (4, 5) -- Ajuste os IDs de cargos técnicos conforme necessário
  AND u.status = 'ativo'
ON DUPLICATE KEY UPDATE 
  ativo = 1,
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- VIEW ÚTIL: Ver usuários visíveis na agenda por unidade
-- =====================================================
CREATE OR REPLACE VIEW `vw_agenda_usuarios` AS
SELECT 
  auv.id AS config_id,
  u.id AS usuario_id,
  u.nome AS usuario_nome,
  u.email AS usuario_email,
  u.foto_url AS usuario_foto,
  c.nome AS cargo_nome,
  auv.unidade_id,
  un.nome AS unidade_nome,
  auv.ativo,
  auv.ordem,
  auv.created_at,
  auv.updated_at
FROM `agenda_usuarios_visiveis` auv
INNER JOIN `usuarios` u ON auv.usuario_id = u.id
INNER JOIN `cargos` c ON u.cargo_id = c.id
LEFT JOIN `unidades` un ON auv.unidade_id = un.id
WHERE u.status = 'ativo'
ORDER BY auv.ordem ASC, u.nome ASC;

-- =====================================================
-- QUERIES ÚTEIS PARA GERENCIAMENTO
-- =====================================================

-- Ver todos os usuários visíveis na agenda (todas as unidades)
-- SELECT * FROM vw_agenda_usuarios WHERE unidade_id IS NULL AND ativo = 1;

-- Ver usuários visíveis para uma unidade específica
-- SELECT * FROM vw_agenda_usuarios WHERE (unidade_id = 1 OR unidade_id IS NULL) AND ativo = 1;

-- Adicionar um usuário à agenda (todas as unidades)
-- INSERT INTO agenda_usuarios_visiveis (usuario_id, unidade_id, ativo, ordem)
-- VALUES (10, NULL, 1, 100);

-- Adicionar um usuário à agenda de uma unidade específica
-- INSERT INTO agenda_usuarios_visiveis (usuario_id, unidade_id, ativo, ordem)
-- VALUES (10, 5, 1, 100);

-- Ocultar um usuário da agenda (sem deletar)
-- UPDATE agenda_usuarios_visiveis SET ativo = 0 WHERE usuario_id = 10;

-- Reordenar usuários
-- UPDATE agenda_usuarios_visiveis SET ordem = 1 WHERE usuario_id = 5;
-- UPDATE agenda_usuarios_visiveis SET ordem = 2 WHERE usuario_id = 8;

-- Remover usuário completamente da agenda
-- DELETE FROM agenda_usuarios_visiveis WHERE usuario_id = 10;

-- Ver estatísticas
-- SELECT 
--   COUNT(*) as total_configuracoes,
--   SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativos,
--   SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as inativos,
--   COUNT(DISTINCT usuario_id) as usuarios_unicos
-- FROM agenda_usuarios_visiveis;
