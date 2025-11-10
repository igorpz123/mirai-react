-- Criar tabela de usuários do portal do cliente
CREATE TABLE IF NOT EXISTS client_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  empresa_id INT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_empresa (empresa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela para documentos do cliente (se não existir)
CREATE TABLE IF NOT EXISTS documentos_cliente (
  id INT PRIMARY KEY AUTO_INCREMENT,
  empresa_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  tamanho VARCHAR(50),
  categoria VARCHAR(100),
  arquivo_path VARCHAR(500) NOT NULL,
  data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_empresa (empresa_id),
  INDEX idx_categoria (categoria),
  INDEX idx_data (data_upload)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campo status nas propostas comerciais se não existir
-- (caso você queira ter controle do status das propostas)
ALTER TABLE propostas_comerciais 
ADD COLUMN IF NOT EXISTS status ENUM('pendente', 'em_analise', 'aprovada', 'recusada', 'concluida') 
DEFAULT 'pendente' 
AFTER descricao;

-- Exemplo: Criar um usuário cliente para teste
-- IMPORTANTE: Altere a senha antes de usar em produção!
-- Senha padrão: 'cliente123' (hash gerado com bcrypt rounds=10)
INSERT INTO client_users (empresa_id, email, password_hash, nome, telefone)
SELECT 
  id, 
  'contato@empresa.com', 
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGa1lfX6H6HNVR9eK6', 
  'Administrador da Empresa',
  '(00) 00000-0000'
FROM empresas 
WHERE razao_social LIKE '%[NOME_DA_EMPRESA]%'
LIMIT 1
ON DUPLICATE KEY UPDATE email = email;

-- Para gerar novos hashes de senha, use o bcrypt com 10 rounds
-- Exemplo em Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('suaSenha', 10);
-- console.log(hash);
