-- =============================================
-- Sistema de Documentos e Templates
-- =============================================

-- Tabela de templates de documentos
CREATE TABLE IF NOT EXISTS document_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo ENUM('contrato', 'proposta', 'relatorio', 'outro') NOT NULL DEFAULT 'outro',
  formato ENUM('docx', 'pdf', 'html') NOT NULL DEFAULT 'docx',
  arquivo_template VARCHAR(500),
  variaveis JSON COMMENT 'Lista de variáveis disponíveis no template',
  ativo BOOLEAN DEFAULT TRUE,
  requer_assinatura BOOLEAN DEFAULT FALSE,
  tipo_assinatura ENUM('digital', 'eletronica', 'ambos') DEFAULT 'eletronica',
  condicao_uso JSON COMMENT 'Condições para usar o template (ex: proposta tem programa)',
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id),
  FOREIGN KEY (updated_by) REFERENCES usuarios(id),
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de documentos gerados
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo ENUM('contrato', 'proposta', 'relatorio', 'outro') NOT NULL,
  formato ENUM('docx', 'pdf') NOT NULL,
  arquivo_path VARCHAR(500) NOT NULL,
  arquivo_size INT,
  entidade_tipo ENUM('proposta', 'empresa', 'tarefa', 'usuario', 'outro'),
  entidade_id INT COMMENT 'ID da entidade relacionada',
  variaveis_utilizadas JSON COMMENT 'Valores das variáveis usadas na geração',
  status ENUM('rascunho', 'gerado', 'assinado', 'cancelado') DEFAULT 'gerado',
  versao_atual INT DEFAULT 1,
  requer_assinatura BOOLEAN DEFAULT FALSE,
  total_assinaturas_requeridas INT DEFAULT 0,
  total_assinaturas_concluidas INT DEFAULT 0,
  generated_by INT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES document_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (generated_by) REFERENCES usuarios(id),
  INDEX idx_template (template_id),
  INDEX idx_tipo (tipo),
  INDEX idx_status (status),
  INDEX idx_entidade (entidade_tipo, entidade_id),
  INDEX idx_generated_by (generated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de versões de documentos
CREATE TABLE IF NOT EXISTS document_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  versao INT NOT NULL,
  arquivo_path VARCHAR(500) NOT NULL,
  arquivo_size INT,
  alteracoes TEXT COMMENT 'Descrição das alterações',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES usuarios(id),
  UNIQUE KEY unique_document_version (document_id, versao),
  INDEX idx_document (document_id),
  INDEX idx_versao (versao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de assinaturas de documentos
CREATE TABLE IF NOT EXISTS document_signatures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  tipo ENUM('digital', 'eletronica') NOT NULL,
  status ENUM('pendente', 'assinado', 'rejeitado', 'expirado') DEFAULT 'pendente',
  ordem INT DEFAULT 0 COMMENT 'Ordem de assinatura (0 = qualquer ordem)',
  
  -- Assinatura Digital (ICP-Brasil)
  certificado_cn VARCHAR(255) COMMENT 'Common Name do certificado',
  certificado_serial VARCHAR(255) COMMENT 'Serial do certificado',
  certificado_issuer VARCHAR(500) COMMENT 'Emissor do certificado',
  certificado_validade DATE COMMENT 'Data de validade do certificado',
  certificado_arquivo VARCHAR(500) COMMENT 'Caminho do certificado (.pem)',
  hash_documento VARCHAR(255) COMMENT 'Hash SHA-256 do documento',
  assinatura_digital TEXT COMMENT 'Assinatura criptográfica',
  
  -- Assinatura Eletrônica (simples)
  ip_address VARCHAR(45),
  user_agent TEXT,
  geolocalizacao VARCHAR(255),
  token_verificacao VARCHAR(255) COMMENT 'Token único para validação',
  
  -- Metadados
  motivo TEXT COMMENT 'Motivo da assinatura/rejeição',
  observacoes TEXT,
  signed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL COMMENT 'Prazo para assinar',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  INDEX idx_document (document_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs de auditoria de documentos
CREATE TABLE IF NOT EXISTS document_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  acao ENUM('criacao', 'visualizacao', 'download', 'edicao', 'assinatura', 'rejeicao', 'cancelamento') NOT NULL,
  descricao TEXT,
  metadata JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  INDEX idx_document (document_id),
  INDEX idx_user (user_id),
  INDEX idx_acao (acao),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View para resumo de documentos com assinaturas
CREATE OR REPLACE VIEW documents_summary AS
SELECT 
  d.id,
  d.nome,
  d.tipo,
  d.formato,
  d.status,
  d.versao_atual,
  d.entidade_tipo,
  d.entidade_id,
  d.requer_assinatura,
  d.total_assinaturas_requeridas,
  d.total_assinaturas_concluidas,
  dt.nome as template_nome,
  u.nome as generated_by_nome,
  u.sobrenome as generated_by_sobrenome,
  d.generated_at,
  d.updated_at,
  COUNT(DISTINCT ds.id) as total_assinaturas,
  COUNT(DISTINCT CASE WHEN ds.status = 'assinado' THEN ds.id END) as assinaturas_concluidas,
  COUNT(DISTINCT CASE WHEN ds.status = 'pendente' THEN ds.id END) as assinaturas_pendentes
FROM documents d
LEFT JOIN document_templates dt ON d.template_id = dt.id
LEFT JOIN usuarios u ON d.generated_by = u.id
LEFT JOIN document_signatures ds ON d.id = ds.document_id
GROUP BY d.id;

-- Inserir template padrão de Contrato de Prestação de Serviços
INSERT INTO document_templates (
  nome, 
  descricao, 
  tipo, 
  formato, 
  variaveis,
  requer_assinatura,
  tipo_assinatura,
  condicao_uso,
  ativo
) VALUES (
  'Contrato de Prestação de Serviços - Programas de Prevenção',
  'Template para contrato de serviços quando a proposta inclui programas de prevenção',
  'contrato',
  'docx',
  JSON_ARRAY(
    'empresa.razao_social',
    'empresa.nome_fantasia',
    'empresa.cnpj',
    'empresa.endereco',
    'empresa.cidade',
    'empresa.estado',
    'empresa.cep',
    'proposta.id',
    'proposta.data',
    'proposta.valor_total',
    'proposta.programas',
    'proposta.observacoes',
    'responsavel.nome_completo',
    'responsavel.cpf',
    'responsavel.email',
    'contratante.nome',
    'contratante.cpf',
    'contratante.cargo',
    'data_atual',
    'data_inicio_vigencia',
    'data_fim_vigencia'
  ),
  TRUE,
  'ambos',
  JSON_OBJECT('tem_programa', TRUE),
  TRUE
);
