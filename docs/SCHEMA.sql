-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 05-Nov-2025 às 14:26
-- Versão do servidor: 5.7.23-23
-- versão do PHP: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `rangou89_mirai`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `agenda_events`
--

CREATE TABLE `agenda_events` (
  `id` int(11) NOT NULL,
  `title` varchar(90) NOT NULL,
  `description` text NOT NULL,
  `color` varchar(20) NOT NULL,
  `start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tarefa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `agenda_usuarios_visiveis`
--

CREATE TABLE `agenda_usuarios_visiveis` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL COMMENT 'ID do usuário que aparecerá na agenda',
  `unidade_id` int(11) DEFAULT NULL COMMENT 'Unidade específica (NULL = todas as unidades)',
  `ativo` tinyint(1) DEFAULT '1' COMMENT '1 = visível, 0 = oculto',
  `ordem` int(11) DEFAULT '0' COMMENT 'Ordem de exibição (menor = primeiro)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `arquivos`
--

CREATE TABLE `arquivos` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) DEFAULT NULL,
  `proposta_id` int(11) DEFAULT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `caminho` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `cargos`
--

CREATE TABLE `cargos` (
  `ID` int(11) NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `cargo_permissoes`
--

CREATE TABLE `cargo_permissoes` (
  `id` int(11) NOT NULL,
  `cargo_id` int(11) NOT NULL,
  `permissao_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `changelog`
--

CREATE TABLE `changelog` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `author_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` varchar(400) NOT NULL,
  `valor` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `empresas`
--

CREATE TABLE `empresas` (
  `id` int(11) NOT NULL,
  `razao_social` varchar(255) NOT NULL,
  `nome_fantasia` varchar(255) NOT NULL,
  `cnpj` varchar(25) DEFAULT NULL,
  `caepf` varchar(15) DEFAULT NULL,
  `cidade` varchar(255) NOT NULL,
  `contabilidade` varchar(255) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `data_renovacao` date DEFAULT NULL,
  `periodicidade` int(11) DEFAULT NULL,
  `primeiro_pgr` year(4) DEFAULT NULL,
  `tecnico_responsavel` int(11) DEFAULT NULL,
  `unidade_responsavel` int(11) NOT NULL,
  `status` varchar(25) NOT NULL DEFAULT 'ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `historico_alteracoes`
--

CREATE TABLE `historico_alteracoes` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) DEFAULT NULL,
  `proposta_id` int(11) DEFAULT NULL,
  `acao` varchar(50) DEFAULT NULL,
  `valor_anterior` json DEFAULT NULL,
  `novo_valor` json DEFAULT NULL,
  `alteracao` text NOT NULL,
  `observacoes` text,
  `usuario_id` int(11) NOT NULL,
  `data_alteracao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `avaliacao_nota` tinyint(3) UNSIGNED DEFAULT NULL,
  `avaliacao_by` int(11) DEFAULT NULL,
  `avaliacao_obs` varchar(300) DEFAULT NULL,
  `avaliacao_data` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `livro_de_registros`
--

CREATE TABLE `livro_de_registros` (
  `id` int(11) NOT NULL,
  `numero` varchar(50) DEFAULT NULL,
  `data_aquisicao` date DEFAULT NULL,
  `participante` varchar(255) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `instrutor` varchar(255) DEFAULT NULL,
  `carga_horaria` decimal(5,2) NOT NULL,
  `data_conclusao` date DEFAULT NULL,
  `modalidade` varchar(100) NOT NULL,
  `sesmo` tinyint(1) NOT NULL DEFAULT '0',
  `nota_fiscal` tinyint(1) NOT NULL DEFAULT '0',
  `pratica` tinyint(1) NOT NULL DEFAULT '0',
  `observacoes` text,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `actor_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(120) DEFAULT NULL,
  `body` varchar(255) NOT NULL,
  `entity_type` varchar(40) DEFAULT NULL,
  `entity_id` bigint(20) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `periodicidades`
--

CREATE TABLE `periodicidades` (
  `id` int(11) NOT NULL,
  `dias` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `permissoes`
--

CREATE TABLE `permissoes` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nome único da permissão (ex: admin, comercial, tecnico)',
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Descrição do que essa permissão permite',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` varchar(400) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `programas_prevencao`
--

CREATE TABLE `programas_prevencao` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `propostas`
--

CREATE TABLE `propostas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `responsavel_id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `unidade_id` int(11) NOT NULL,
  `indicacao_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `payment_method` varchar(30) NOT NULL,
  `payment_installments` int(11) NOT NULL,
  `data` date NOT NULL,
  `data_alteracao` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `propostas_cursos`
--

CREATE TABLE `propostas_cursos` (
  `id` int(11) NOT NULL,
  `proposta_id` int(11) DEFAULT NULL,
  `curso_id` int(11) DEFAULT NULL,
  `quantidade` int(11) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) DEFAULT '0.00',
  `valor_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `propostas_produtos`
--

CREATE TABLE `propostas_produtos` (
  `id` int(11) NOT NULL,
  `proposta_id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) DEFAULT '0.00',
  `valor_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estrutura da tabela `propostas_programas`
--

CREATE TABLE `propostas_programas` (
  `id` int(11) NOT NULL,
  `proposta_id` int(11) DEFAULT NULL,
  `programa_id` int(11) DEFAULT NULL,
  `quantidade` int(11) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) DEFAULT NULL,
  `valor_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `propostas_quimicos`
--

CREATE TABLE `propostas_quimicos` (
  `id` int(11) NOT NULL,
  `proposta_id` int(11) NOT NULL,
  `grupo` int(11) NOT NULL,
  `pontos` int(11) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  `desconto` decimal(10,2) DEFAULT '0.00',
  `valor_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estrutura da tabela `regras_preco_produtos`
--

CREATE TABLE `regras_preco_produtos` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `preco_linear` tinyint(10) NOT NULL,
  `min_quantidade` int(11) NOT NULL,
  `max_quantidade` int(11) NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL,
  `preco_adicional` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estrutura da tabela `regras_preco_programas`
--

CREATE TABLE `regras_preco_programas` (
  `id` int(11) NOT NULL,
  `programa_id` int(11) NOT NULL,
  `preco_linear` tinyint(10) NOT NULL,
  `min_quantidade` int(11) NOT NULL,
  `max_quantidade` int(11) NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL,
  `preco_adicional` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Estrutura da tabela `setor`
--

CREATE TABLE `setor` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `sequencial` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `tabela_quimicos`
--

CREATE TABLE `tabela_quimicos` (
  `grupo` int(11) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `tarefas`
--

CREATE TABLE `tarefas` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `finalidade_id` int(11) NOT NULL,
  `prioridade` varchar(50) NOT NULL,
  `status` varchar(50) DEFAULT 'pendente',
  `prazo` date DEFAULT NULL,
  `setor_id` int(11) DEFAULT NULL,
  `responsavel_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int(11) NOT NULL,
  `unidade_id` int(11) NOT NULL,
  `data_alteracao` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `tarefas_concluidas`
--

CREATE TABLE `tarefas_concluidas` (
  `id` int(11) NOT NULL,
  `tarefa_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `setor_id` int(11) NOT NULL,
  `unidade_id` int(11) NOT NULL,
  `data_conclusao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `tipo_tarefa`
--

CREATE TABLE `tipo_tarefa` (
  `id` int(11) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `setor_responsavel_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `unidades`
--

CREATE TABLE `unidades` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `user_login`
--

CREATE TABLE `user_login` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sobrenome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cargo_id` int(11) NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Senha armazenada como hash seguro',
  `foto_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_seen` datetime DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuario_setores`
--

CREATE TABLE `usuario_setores` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `setor_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuario_unidades`
--

CREATE TABLE `usuario_unidades` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `unidade_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estrutura stand-in para vista `vw_agenda_usuarios`
-- (Veja abaixo para a view atual)
--
CREATE TABLE `vw_agenda_usuarios` (
`config_id` int(11)
,`usuario_id` int(11)
,`usuario_nome` varchar(255)
,`usuario_email` varchar(255)
,`usuario_foto` varchar(255)
,`cargo_nome` varchar(100)
,`unidade_id` int(11)
,`unidade_nome` varchar(255)
,`ativo` tinyint(1)
,`ordem` int(11)
,`created_at` timestamp
,`updated_at` timestamp
);

-- --------------------------------------------------------

--
-- Estrutura stand-in para vista `vw_cargo_permissoes`
-- (Veja abaixo para a view atual)
--
CREATE TABLE `vw_cargo_permissoes` (
`cargo_id` int(11)
,`cargo_nome` varchar(100)
,`permissoes` text
);

-- --------------------------------------------------------

--
-- Estrutura stand-in para vista `vw_usuario_permissoes`
-- (Veja abaixo para a view atual)
--
CREATE TABLE `vw_usuario_permissoes` (
`usuario_id` int(11)
,`nome` varchar(255)
,`email` varchar(255)
,`cargo_id` int(11)
,`cargo_nome` varchar(100)
,`permissao_id` int(11)
,`permissao_nome` varchar(100)
,`permissao_descricao` varchar(255)
);

-- --------------------------------------------------------

--
-- Estrutura para vista `vw_agenda_usuarios`
--
DROP TABLE IF EXISTS `vw_agenda_usuarios`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_agenda_usuarios`  AS SELECT `auv`.`id` AS `config_id`, `u`.`id` AS `usuario_id`, `u`.`nome` AS `usuario_nome`, `u`.`email` AS `usuario_email`, `u`.`foto_url` AS `usuario_foto`, `c`.`nome` AS `cargo_nome`, `auv`.`unidade_id` AS `unidade_id`, `un`.`nome` AS `unidade_nome`, `auv`.`ativo` AS `ativo`, `auv`.`ordem` AS `ordem`, `auv`.`created_at` AS `created_at`, `auv`.`updated_at` AS `updated_at` FROM (((`agenda_usuarios_visiveis` `auv` join `usuarios` `u` on((`auv`.`usuario_id` = `u`.`id`))) join `cargos` `c` on((`u`.`cargo_id` = `c`.`ID`))) left join `unidades` `un` on((`auv`.`unidade_id` = `un`.`id`))) WHERE (`u`.`status` = 'ativo') ORDER BY `auv`.`ordem` ASC, `u`.`nome` ASC ;

-- --------------------------------------------------------

--
-- Estrutura para vista `vw_cargo_permissoes`
--
DROP TABLE IF EXISTS `vw_cargo_permissoes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_cargo_permissoes`  AS SELECT `c`.`ID` AS `cargo_id`, `c`.`nome` AS `cargo_nome`, group_concat(`p`.`nome` order by `p`.`nome` ASC separator ', ') AS `permissoes` FROM ((`cargos` `c` left join `cargo_permissoes` `cp` on((`c`.`ID` = `cp`.`cargo_id`))) left join `permissoes` `p` on((`cp`.`permissao_id` = `p`.`id`))) GROUP BY `c`.`ID`, `c`.`nome` ORDER BY `c`.`ID` ASC ;

-- --------------------------------------------------------

--
-- Estrutura para vista `vw_usuario_permissoes`
--
DROP TABLE IF EXISTS `vw_usuario_permissoes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_usuario_permissoes`  AS SELECT `u`.`id` AS `usuario_id`, `u`.`nome` AS `nome`, `u`.`email` AS `email`, `c`.`ID` AS `cargo_id`, `c`.`nome` AS `cargo_nome`, `p`.`id` AS `permissao_id`, `p`.`nome` AS `permissao_nome`, `p`.`descricao` AS `permissao_descricao` FROM (((`usuarios` `u` join `cargos` `c` on((`u`.`cargo_id` = `c`.`ID`))) join `cargo_permissoes` `cp` on((`c`.`ID` = `cp`.`cargo_id`))) join `permissoes` `p` on((`cp`.`permissao_id` = `p`.`id`))) ;

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `agenda_events`
--
ALTER TABLE `agenda_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarefa_id` (`tarefa_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices para tabela `agenda_usuarios_visiveis`
--
ALTER TABLE `agenda_usuarios_visiveis`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usuario_unidade` (`usuario_id`,`unidade_id`),
  ADD KEY `idx_usuario_id` (`usuario_id`),
  ADD KEY `idx_unidade_id` (`unidade_id`),
  ADD KEY `idx_ativo` (`ativo`);

--
-- Índices para tabela `arquivos`
--
ALTER TABLE `arquivos`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `cargos`
--
ALTER TABLE `cargos`
  ADD PRIMARY KEY (`ID`);

--
-- Índices para tabela `cargo_permissoes`
--
ALTER TABLE `cargo_permissoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cargo_permissao` (`cargo_id`,`permissao_id`),
  ADD KEY `idx_cargo_id` (`cargo_id`),
  ADD KEY `idx_permissao_id` (`permissao_id`);

--
-- Índices para tabela `changelog`
--
ALTER TABLE `changelog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_at` (`created_at`);

--
-- Índices para tabela `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tecnico_responsavel` (`tecnico_responsavel`),
  ADD KEY `fk_unidade_responsavel` (`unidade_responsavel`);

--
-- Índices para tabela `historico_alteracoes`
--
ALTER TABLE `historico_alteracoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `fk_historico_tarefas` (`tarefa_id`),
  ADD KEY `fk_proposta` (`proposta_id`);

--
-- Índices para tabela `livro_de_registros`
--
ALTER TABLE `livro_de_registros`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_livro_empresa` (`empresa_id`),
  ADD KEY `idx_livro_curso` (`curso_id`),
  ADD KEY `idx_livro_participante` (`participante`);

--
-- Índices para tabela `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_user_unread` (`user_id`,`read_at`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `fk_notifications_actor` (`actor_id`);

--
-- Índices para tabela `periodicidades`
--
ALTER TABLE `periodicidades`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `permissoes`
--
ALTER TABLE `permissoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`),
  ADD KEY `idx_nome` (`nome`);

--
-- Índices para tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `programas_prevencao`
--
ALTER TABLE `programas_prevencao`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `propostas`
--
ALTER TABLE `propostas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_propostas_responsavel` (`responsavel_id`),
  ADD KEY `fk_propostas_unidade` (`unidade_id`),
  ADD KEY `fk_propostas_indicacao` (`indicacao_id`),
  ADD KEY `fk_propostas_empresa` (`empresa_id`);

--
-- Índices para tabela `propostas_cursos`
--
ALTER TABLE `propostas_cursos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposta_id` (`proposta_id`),
  ADD KEY `produto_id` (`curso_id`);

--
-- Índices para tabela `propostas_produtos`
--
ALTER TABLE `propostas_produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_produtos_propostas` (`produto_id`),
  ADD KEY `fk_propostas_produtos` (`proposta_id`) USING BTREE;

--
-- Índices para tabela `propostas_programas`
--
ALTER TABLE `propostas_programas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proposta_id` (`proposta_id`),
  ADD KEY `programa_id` (`programa_id`) USING BTREE;

--
-- Índices para tabela `propostas_quimicos`
--
ALTER TABLE `propostas_quimicos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_proposta_quimico` (`proposta_id`),
  ADD KEY `fk_quimico` (`grupo`);

--
-- Índices para tabela `regras_preco_produtos`
--
ALTER TABLE `regras_preco_produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_produto` (`produto_id`);

--
-- Índices para tabela `regras_preco_programas`
--
ALTER TABLE `regras_preco_programas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_programa_id` (`programa_id`);

--
-- Índices para tabela `setor`
--
ALTER TABLE `setor`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `tabela_quimicos`
--
ALTER TABLE `tabela_quimicos`
  ADD UNIQUE KEY `grupo` (`grupo`);

--
-- Índices para tabela `tarefas`
--
ALTER TABLE `tarefas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empresa_id` (`empresa_id`),
  ADD KEY `setor_id` (`setor_id`),
  ADD KEY `responsavel_id` (`responsavel_id`),
  ADD KEY `fk_unidade_id` (`unidade_id`),
  ADD KEY `fk_criador_tarefa` (`created_by`),
  ADD KEY `fk_finalidade_id` (`finalidade_id`);

--
-- Índices para tabela `tarefas_concluidas`
--
ALTER TABLE `tarefas_concluidas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tarefa_id` (`tarefa_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `fk_setor` (`setor_id`),
  ADD KEY `fk_unidade` (`unidade_id`);

--
-- Índices para tabela `tipo_tarefa`
--
ALTER TABLE `tipo_tarefa`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `unidades`
--
ALTER TABLE `unidades`
  ADD PRIMARY KEY (`id`);

--
-- Índices para tabela `user_login`
--
ALTER TABLE `user_login`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices para tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `cargo_id` (`cargo_id`);

--
-- Índices para tabela `usuario_setores`
--
ALTER TABLE `usuario_setores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `setor_id` (`setor_id`);

--
-- Índices para tabela `usuario_unidades`
--
ALTER TABLE `usuario_unidades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `unidade_id` (`unidade_id`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `agenda_events`
--
ALTER TABLE `agenda_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `agenda_usuarios_visiveis`
--
ALTER TABLE `agenda_usuarios_visiveis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `arquivos`
--
ALTER TABLE `arquivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cargos`
--
ALTER TABLE `cargos`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cargo_permissoes`
--
ALTER TABLE `cargo_permissoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `changelog`
--
ALTER TABLE `changelog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico_alteracoes`
--
ALTER TABLE `historico_alteracoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `livro_de_registros`
--
ALTER TABLE `livro_de_registros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `periodicidades`
--
ALTER TABLE `periodicidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `permissoes`
--
ALTER TABLE `permissoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `programas_prevencao`
--
ALTER TABLE `programas_prevencao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `propostas`
--
ALTER TABLE `propostas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `propostas_cursos`
--
ALTER TABLE `propostas_cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `propostas_produtos`
--
ALTER TABLE `propostas_produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `propostas_programas`
--
ALTER TABLE `propostas_programas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `propostas_quimicos`
--
ALTER TABLE `propostas_quimicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `regras_preco_produtos`
--
ALTER TABLE `regras_preco_produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `regras_preco_programas`
--
ALTER TABLE `regras_preco_programas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `setor`
--
ALTER TABLE `setor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tarefas`
--
ALTER TABLE `tarefas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tarefas_concluidas`
--
ALTER TABLE `tarefas_concluidas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tipo_tarefa`
--
ALTER TABLE `tipo_tarefa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `unidades`
--
ALTER TABLE `unidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `user_login`
--
ALTER TABLE `user_login`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario_setores`
--
ALTER TABLE `usuario_setores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario_unidades`
--
ALTER TABLE `usuario_unidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `agenda_events`
--
ALTER TABLE `agenda_events`
  ADD CONSTRAINT `agenda_events_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agenda_events_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `agenda_usuarios_visiveis`
--
ALTER TABLE `agenda_usuarios_visiveis`
  ADD CONSTRAINT `agenda_usuarios_visiveis_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agenda_usuarios_visiveis_ibfk_2` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `cargo_permissoes`
--
ALTER TABLE `cargo_permissoes`
  ADD CONSTRAINT `cargo_permissoes_ibfk_1` FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `cargo_permissoes_ibfk_2` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `empresas`
--
ALTER TABLE `empresas`
  ADD CONSTRAINT `empresas_ibfk_1` FOREIGN KEY (`tecnico_responsavel`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `fk_unidade_responsavel` FOREIGN KEY (`unidade_responsavel`) REFERENCES `unidades` (`id`);

--
-- Limitadores para a tabela `historico_alteracoes`
--
ALTER TABLE `historico_alteracoes`
  ADD CONSTRAINT `fk_historico_tarefas` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_proposta` FOREIGN KEY (`proposta_id`) REFERENCES `propostas` (`id`),
  ADD CONSTRAINT `historico_alteracoes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `livro_de_registros`
--
ALTER TABLE `livro_de_registros`
  ADD CONSTRAINT `fk_livro_cursos` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_livro_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE;

--
-- Limitadores para a tabela `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_actor` FOREIGN KEY (`actor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `propostas`
--
ALTER TABLE `propostas`
  ADD CONSTRAINT `fk_propostas_empresa` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_propostas_indicacao` FOREIGN KEY (`indicacao_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_propostas_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_propostas_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limitadores para a tabela `propostas_cursos`
--
ALTER TABLE `propostas_cursos`
  ADD CONSTRAINT `propostas_cursos_ibfk_1` FOREIGN KEY (`proposta_id`) REFERENCES `propostas` (`id`),
  ADD CONSTRAINT `propostas_cursos_ibfk_2` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`);

--
-- Limitadores para a tabela `propostas_produtos`
--
ALTER TABLE `propostas_produtos`
  ADD CONSTRAINT `fk_produtos_propostas` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`),
  ADD CONSTRAINT `fk_propostaS_produtos` FOREIGN KEY (`proposta_id`) REFERENCES `propostas` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `propostas_programas`
--
ALTER TABLE `propostas_programas`
  ADD CONSTRAINT `propostas_programas_ibfk_1` FOREIGN KEY (`proposta_id`) REFERENCES `propostas` (`id`),
  ADD CONSTRAINT `propostas_programas_ibfk_2` FOREIGN KEY (`programa_id`) REFERENCES `programas_prevencao` (`id`);

--
-- Limitadores para a tabela `propostas_quimicos`
--
ALTER TABLE `propostas_quimicos`
  ADD CONSTRAINT `fk_proposta_quimico` FOREIGN KEY (`proposta_id`) REFERENCES `propostas` (`id`),
  ADD CONSTRAINT `fk_quimico` FOREIGN KEY (`grupo`) REFERENCES `tabela_quimicos` (`grupo`);

--
-- Limitadores para a tabela `regras_preco_produtos`
--
ALTER TABLE `regras_preco_produtos`
  ADD CONSTRAINT `fk_produto` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`);

--
-- Limitadores para a tabela `regras_preco_programas`
--
ALTER TABLE `regras_preco_programas`
  ADD CONSTRAINT `fk_programa_id` FOREIGN KEY (`programa_id`) REFERENCES `programas_prevencao` (`id`);

--
-- Limitadores para a tabela `tarefas`
--
ALTER TABLE `tarefas`
  ADD CONSTRAINT `fk_criador_tarefa` FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_finalidade_id` FOREIGN KEY (`finalidade_id`) REFERENCES `tipo_tarefa` (`id`),
  ADD CONSTRAINT `fk_unidade_id` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tarefas_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefas_ibfk_2` FOREIGN KEY (`setor_id`) REFERENCES `setor` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefas_ibfk_3` FOREIGN KEY (`responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `tarefas_concluidas`
--
ALTER TABLE `tarefas_concluidas`
  ADD CONSTRAINT `fk_setor` FOREIGN KEY (`setor_id`) REFERENCES `setor` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_unidade` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefas_concluidas_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tarefas_concluidas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `user_login`
--
ALTER TABLE `user_login`
  ADD CONSTRAINT `user_login_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`);

--
-- Limitadores para a tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_user_cargo` FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Limitadores para a tabela `usuario_setores`
--
ALTER TABLE `usuario_setores`
  ADD CONSTRAINT `usuario_setores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_setores_ibfk_2` FOREIGN KEY (`setor_id`) REFERENCES `setor` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `usuario_unidades`
--
ALTER TABLE `usuario_unidades`
  ADD CONSTRAINT `usuario_unidades_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_unidades_ibfk_2` FOREIGN KEY (`unidade_id`) REFERENCES `unidades` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
