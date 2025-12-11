-- Adicionar coluna numero_referencia na tabela propostas
ALTER TABLE `propostas` 
ADD COLUMN `numero_referencia` VARCHAR(20) NULL AFTER `id`,
ADD UNIQUE KEY `idx_numero_referencia` (`numero_referencia`);

-- Atualizar propostas existentes com numeração sequencial por ano
SET @row_number = 0;
SET @current_year = '';

UPDATE propostas p
INNER JOIN (
  SELECT 
    id,
    CONCAT(
      LPAD(
        (@row_number := IF(@current_year = YEAR(data), @row_number + 1, 1)),
        4,
        '0'
      ),
      '/',
      YEAR(data)
    ) as new_ref,
    (@current_year := YEAR(data)) as year_tracker
  FROM propostas
  ORDER BY YEAR(data) ASC, id ASC
) as numbered ON p.id = numbered.id
SET p.numero_referencia = numbered.new_ref;
