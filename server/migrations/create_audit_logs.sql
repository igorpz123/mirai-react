-- =============================================
-- Migration: Sistema de Auditoria Completo
-- Descrição: Tabela para rastrear todas as ações do sistema
-- Data: Dezembro 2025
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Informações do usuário
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  
  -- Informações da ação
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, READ, LOGIN, LOGOUT, EXPORT, etc.
  entity_type VARCHAR(50) NOT NULL, -- task, proposal, company, user, etc.
  entity_id INT NULL, -- ID da entidade afetada (NULL para ações gerais)
  
  -- Detalhes da mudança
  description TEXT NOT NULL, -- Descrição legível da ação
  changes JSON NULL, -- Objeto com before/after para updates
  metadata JSON NULL, -- Informações adicionais contextuais
  
  -- Informações da requisição
  ip_address VARCHAR(45) NULL, -- Suporta IPv4 e IPv6
  user_agent TEXT NULL,
  request_method VARCHAR(10) NULL, -- GET, POST, PUT, DELETE
  request_path VARCHAR(500) NULL,
  
  -- Status e resultado
  status VARCHAR(20) DEFAULT 'success', -- success, failure, error
  error_message TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para performance
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status),
  INDEX idx_user_action (user_id, action, created_at),
  
  -- Foreign key (soft - não bloqueia deleção de usuários)
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Comentários das colunas
-- =============================================

ALTER TABLE audit_logs 
  MODIFY COLUMN action VARCHAR(50) NOT NULL COMMENT 'Tipo de ação: CREATE, UPDATE, DELETE, READ, LOGIN, LOGOUT, EXPORT, IMPORT, etc.',
  MODIFY COLUMN entity_type VARCHAR(50) NOT NULL COMMENT 'Tipo de entidade: task, proposal, company, user, permission, etc.',
  MODIFY COLUMN entity_id INT NULL COMMENT 'ID da entidade afetada (NULL para ações gerais como LOGIN)',
  MODIFY COLUMN changes JSON NULL COMMENT 'Objeto JSON com campos "before" e "after" para rastrear mudanças',
  MODIFY COLUMN metadata JSON NULL COMMENT 'Informações adicionais contextuais específicas da ação',
  MODIFY COLUMN status VARCHAR(20) DEFAULT 'success' COMMENT 'Resultado da ação: success, failure, error';

-- =============================================
-- View para relatórios simplificados
-- =============================================

CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
  al.id,
  al.user_name,
  al.user_email,
  al.action,
  al.entity_type,
  al.entity_id,
  al.description,
  al.status,
  al.created_at,
  al.ip_address,
  DATE(al.created_at) as action_date,
  HOUR(al.created_at) as action_hour
FROM audit_logs al
ORDER BY al.created_at DESC;

-- =============================================
-- Inserir log inicial do sistema
-- =============================================

INSERT INTO audit_logs (
  user_id, 
  user_name, 
  user_email, 
  action, 
  entity_type, 
  entity_id,
  description,
  status
) VALUES (
  1,
  'Sistema',
  'system@mirai.com',
  'CREATE',
  'audit_system',
  NULL,
  'Sistema de Auditoria inicializado com sucesso',
  'success'
);

-- =============================================
-- Procedure para limpeza automática (opcional)
-- Logs com mais de 2 anos podem ser arquivados
-- =============================================

DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS archive_old_audit_logs(
  IN days_to_keep INT
)
BEGIN
  DECLARE rows_affected INT;
  
  -- Criar tabela de arquivo se não existir
  CREATE TABLE IF NOT EXISTS audit_logs_archive LIKE audit_logs;
  
  -- Mover logs antigos para arquivo
  INSERT INTO audit_logs_archive
  SELECT * FROM audit_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  -- Deletar logs movidos
  DELETE FROM audit_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  SET rows_affected = ROW_COUNT();
  
  SELECT CONCAT('Arquivados ', rows_affected, ' logs de auditoria') as result;
END$$

DELIMITER ;

-- =============================================
-- Comentários finais
-- =============================================

-- Para arquivar logs com mais de 730 dias (2 anos):
-- CALL archive_old_audit_logs(730);

-- Para consultar logs recentes:
-- SELECT * FROM audit_logs_summary WHERE action_date >= CURDATE() - INTERVAL 7 DAY;

-- Para estatísticas por usuário:
-- SELECT user_name, action, COUNT(*) as total 
-- FROM audit_logs 
-- GROUP BY user_name, action 
-- ORDER BY total DESC;
