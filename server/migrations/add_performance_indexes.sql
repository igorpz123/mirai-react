-- Performance Indexes for Mirai React Database
-- Run these indexes to improve query performance on frequently accessed columns

-- Propostas table indexes
CREATE INDEX IF NOT EXISTS idx_propostas_responsavel ON propostas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_propostas_unidade ON propostas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_data ON propostas(data);
CREATE INDEX IF NOT EXISTS idx_propostas_data_alteracao ON propostas(data_alteracao);
CREATE INDEX IF NOT EXISTS idx_propostas_indicacao ON propostas(indicacao_id);
CREATE INDEX IF NOT EXISTS idx_propostas_empresa ON propostas(empresa_id);

-- Propostas item tables indexes (for JOIN optimization)
CREATE INDEX IF NOT EXISTS idx_propostas_cursos_proposta ON propostas_cursos(proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostas_quimicos_proposta ON propostas_quimicos(proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostas_produtos_proposta ON propostas_produtos(proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostas_programas_proposta ON propostas_programas(proposta_id);

-- Tarefas table indexes
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_unidade ON tarefas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_setor ON tarefas(setor_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo ON tarefas(prazo);
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa ON tarefas(empresa_id);

-- Usuarios table indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo ON usuarios(cargo_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_last_seen ON usuarios(last_seen);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_propostas_unit_status ON propostas(unidade_id, status);
CREATE INDEX IF NOT EXISTS idx_propostas_resp_status ON propostas(responsavel_id, status);
CREATE INDEX IF NOT EXISTS idx_tarefas_unit_status ON tarefas(unidade_id, status);
CREATE INDEX IF NOT EXISTS idx_tarefas_resp_status ON tarefas(responsavel_id, status);
