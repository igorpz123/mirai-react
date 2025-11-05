# ❓ FAQ Completo - Sistema Mirai

**Perguntas Frequentes Organizadas por Módulo**

[🔐 Login e Autenticação](#-login-e-autenticação) | [🧭 Navegação](#-navegação) | [🔍 Busca Global](#-busca-global) | [🏢 Empresas](#-empresas) | [⚙️ Técnico](#️-módulo-técnico) | [💼 Comercial](#-módulo-comercial) | [👥 Admin](#-módulo-administrativo) | [🔔 Notificações](#-notificações) | [🤖 IA](#-chat-ia) | [🔧 Problemas](#-problemas-técnicos)

---

## 🔐 Login e Autenticação

### Q: Esqueci minha senha, o que fazer?
**R:** Entre em contato com seu administrador do sistema para resetar sua senha. Ele gerará uma senha temporária que você deverá alterar no próximo login.

### Q: Por que fui desconectado automaticamente?
**R:** Por segurança, o sistema desconecta usuários após 2 horas de inatividade. Você receberá um aviso 2 minutos antes da desconexão.

### Q: Posso usar o sistema em múltiplos dispositivos simultaneamente?
**R:** Sim, você pode acessar de diferentes dispositivos, mas será desconectado do dispositivo anterior ao fazer login em um novo por motivos de segurança.

### Q: O sistema funciona em celulares?
**R:** Sim! O sistema é responsivo e funciona em navegadores móveis, mas algumas funcionalidades são otimizadas para desktop (propostas, relatórios complexos).

### Q: Minha senha expirou?
**R:** Senhas não expiram automaticamente no sistema, mas é recomendado alterá-las a cada 3-6 meses por segurança.

### Q: Posso ter login com redes sociais (Google, Facebook)?
**R:** Atualmente não. O login é feito apenas com email e senha cadastrados no sistema.

### Q: O que significa "sessão expirada"?
**R:** Significa que você ficou inativo por mais de 2 horas ou que sua sessão foi encerrada por questões de segurança. Faça login novamente.

### Q: Quantas tentativas de login erradas posso fazer?
**R:** Após 5 tentativas falhas, sua conta é temporariamente bloqueada por 15 minutos. Contate o administrador se precisar desbloquear antes.

---

## 🧭 Navegação

### Q: O menu lateral sumiu, como trazer de volta?
**R:** Clique no ícone [≡] (três linhas) no canto superior esquerdo ou aumente a janela do navegador. Em telas pequenas, o menu se recolhe automaticamente.

### Q: Como volto para a página anterior?
**R:** Use a trilha de navegação (breadcrumbs) no topo da página ou clique novamente no item do menu lateral. **Evite usar o botão "Voltar" do navegador.**

### Q: Posso personalizar o menu lateral?
**R:** Não. O menu é gerado automaticamente baseado nas suas permissões. Entre em contato com o administrador para ajustar seu perfil de acesso.

### Q: Por que não vejo certas opções do menu?
**R:** O menu exibe apenas funcionalidades que você tem permissão para acessar. Seu perfil (Técnico, Comercial, Admin) determina o que aparece.

### Q: Como abro múltiplas páginas ao mesmo tempo?
**R:** Use abas do navegador. Clique com botão direito em um link e selecione "Abrir em nova aba" ou use Ctrl+Click.

### Q: O que é o ícone de notificação no topo?
**R:** O ícone 🔔 mostra suas notificações. O número indica quantas não lidas você tem.

---

## 🔍 Busca Global

### Q: Como acesso a busca global?
**R:** Pressione **Ctrl+K** (ou **⌘K** no Mac) de qualquer lugar no sistema. Ou clique no ícone 🔍 na barra superior.

### Q: Por que não encontro uma empresa que sei que existe?
**R:** Verifique: 1) Se você tem permissão para visualizá-la, 2) Se digitou o nome corretamente, 3) Tente buscar pelo CNPJ.

### Q: A busca não mostra resultados, está quebrada?
**R:** Aguarde terminar de digitar. O sistema espera 300ms de pausa antes de buscar (debounce). Também é necessário no mínimo 2 caracteres.

### Q: Posso buscar por data?
**R:** Não diretamente. Busque pelo nome/número do item e use filtros na página de resultados para refinar por data.

### Q: Como busco por múltiplas palavras?
**R:** Digite todas as palavras separadas por espaço. Ex: "proposta comercial 2024". O sistema busca todas as palavras.

### Q: O histórico de buscas é salvo?
**R:** Sim, as últimas 10 buscas são salvas **localmente no seu navegador** (não no servidor). Se limpar cache, perde o histórico.

### Q: Posso buscar em campos específicos (só CNPJ, só título)?
**R:** Não. A busca procura em múltiplos campos simultaneamente. Use termos específicos para resultados mais precisos.

### Q: Por que alguns resultados aparecem primeiro?
**R:** O sistema usa algoritmo de relevância: match no título vale mais que na descrição, status "Pendente" tem boost, etc.

---

## 🏢 Empresas

### Q: Posso cadastrar empresa sem CNPJ?
**R:** Não. O CNPJ é obrigatório e único no sistema. Cada empresa deve ter um CNPJ válido.

### Q: Como desvincular uma tarefa de uma empresa?
**R:** Acesse a tarefa, clique em "Editar" e altere a empresa associada. A tarefa será movida para a nova empresa.

### Q: Posso ter duas empresas com o mesmo nome?
**R:** Sim, desde que tenham CNPJs diferentes. O CNPJ é a chave única, não o nome.

### Q: Como exporto a lista de empresas?
**R:** Atualmente não há exportação direta. Consulte o administrador para gerar relatório ou exportação do banco de dados.

### Q: Posso adicionar múltiplos contatos para uma empresa?
**R:** Sim, use os campos de telefone/email secundários. Para mais contatos, use o campo "Observações" ou crie registros no Livro.

### Q: O que acontece se eu excluir uma empresa?
**R:** Apenas administradores podem excluir. Se a empresa tiver tarefas ou propostas vinculadas, a exclusão pode ser bloqueada para preservar histórico.

### Q: Como editar o CNPJ de uma empresa?
**R:** Não é possível editar CNPJ após o cadastro. Se errou, exclua a empresa (se possível) e crie novamente, ou contate o administrador para ajuste direto no banco.

### Q: O preenchimento automático de endereço não funciona
**R:** Verifique: 1) Se o CEP está correto (8 dígitos), 2) Se tem conexão com internet, 3) Se o CEP existe nos Correios. Alguns CEPs novos podem não estar cadastrados.

---

## ⚙️ Módulo Técnico

### Q: Posso atribuir tarefa para outro usuário?
**R:** Sim, ao criar ou editar uma tarefa, selecione o usuário desejado no campo "Responsável".

### Q: Como vejo apenas minhas tarefas?
**R:** Use o filtro "Responsável" no Dashboard ou Agenda e selecione seu nome. Ou busque por "@eu" na busca global.

### Q: Posso criar subtarefas?
**R:** Não há sistema nativo de subtarefas. Use o campo descrição para listar etapas ou crie tarefas relacionadas mencionando o número principal (ex: "Tarefa #145 - Etapa 2").

### Q: Como recebo notificação de nova tarefa?
**R:** Notificações automáticas são enviadas em tempo real quando você é atribuído a uma tarefa. Verifique o ícone 🔔.

### Q: O mapa funciona offline?
**R:** Não. É necessária conexão com internet para carregar o mapa e os marcadores.

### Q: Como imprimo a agenda?
**R:** Use a função de impressão do navegador (Ctrl+P). O sistema tentará formatar a impressão automaticamente.

### Q: Posso ter tarefas recorrentes (todo dia/semana)?
**R:** Não há automação de tarefas recorrentes. Crie manualmente ou duplique tarefas existentes.

### Q: Como vejo tarefas de toda a equipe?
**R:** Administradores veem todas. Técnicos veem apenas tarefas do seu setor/unidade. Use filtros para visualizar por usuário específico.

### Q: Por que não posso editar uma tarefa?
**R:** Verifique suas permissões. Apenas o responsável, criador ou administradores podem editar tarefas.

### Q: Como cancelo uma tarefa?
**R:** Abra a tarefa → "Alterar Status" → "Cancelada". Adicione motivo em comentário para histórico.

---

## 💼 Módulo Comercial

### Q: Posso converter proposta aprovada em tarefa automaticamente?
**R:** Não. Você precisa criar as tarefas manualmente no módulo técnico após aprovação da proposta.

### Q: Como envio a proposta para o cliente?
**R:** Gere o PDF usando o botão "Gerar PDF" e envie por email/WhatsApp manualmente. O sistema não envia automaticamente.

### Q: Posso ter descontos por item e desconto geral?
**R:** Sim! Você pode aplicar desconto individual em cada item e depois um desconto geral sobre o subtotal.

### Q: O cliente pode visualizar a proposta online?
**R:** Atualmente não. O cliente visualiza apenas o PDF que você enviar. Não há portal de cliente.

### Q: Como sei se o cliente viu a proposta?
**R:** Não há rastreamento automático. Registre no Livro de Registros quando tiver confirmação do cliente (ligação, email, etc.).

### Q: Posso duplicar uma proposta para outro cliente?
**R:** Sim! Use o botão "Duplicar", altere a empresa associada e ajuste valores conforme necessário.

### Q: O que acontece com proposta após validade expirar?
**R:** Nada automaticamente. O sistema não bloqueia uso após vencimento. Controle manualmente e crie nova versão se necessário.

### Q: Como atualizo preços do catálogo de itens?
**R:** Acesse "Itens Comerciais", edite o item desejado e atualize o "Valor Padrão". Propostas antigas não são afetadas.

### Q: Itens inativos aparecem em propostas?
**R:** Não. Ao marcar item como inativo, ele deixa de aparecer na lista de seleção de novas propostas.

### Q: Posso anexar imagens nas propostas?
**R:** Sim, use o campo "Anexos" para adicionar imagens, PDFs e outros documentos (máximo 10MB por arquivo).

---

## 👥 Módulo Administrativo

### Q: Posso ter usuário sem unidade ou setor?
**R:** Não. Unidade e Setor são obrigatórios para organização adequada do sistema.

### Q: Como migro usuário de uma unidade para outra?
**R:** Edite o usuário e altere a unidade. Tarefas antigas permanecem vinculadas à unidade original para histórico.

### Q: Posso criar permissões customizadas?
**R:** Atualmente não. Use as 3 permissões base: **admin**, **comercial**, **tecnico**. Combinações são permitidas.

### Q: O que acontece se eu desativar uma unidade/setor?
**R:** Usuários daquele setor/unidade ficam sem vínculo ativo e podem perder acesso ao sistema. Migre usuários antes de desativar.

### Q: Como exporto lista de usuários?
**R:** Não há exportação direta na interface. Consulte desenvolvedor para acesso ao banco de dados ou geração de relatório.

### Q: Posso ter dois usuários com mesmo email?
**R:** Não. Email é único no sistema e serve como login.

### Q: Como resetar senha de usuário?
**R:** Acesse "Usuários" → selecione usuário → "Resetar Senha". Uma senha temporária será gerada. Comunique ao usuário.

### Q: Usuário desativado perde dados?
**R:** Não. Todas as tarefas, propostas e registros criados por ele permanecem no sistema. Ele apenas não consegue fazer login.

### Q: Como deleto usuário permanentemente?
**R:** Na edição do usuário, clique em "Excluir". **ATENÇÃO:** Isto remove TODAS as atribuições dele. Prefira "Desativar".

---

## 🔔 Notificações

### Q: Recebo notificação por email também?
**R:** Atualmente não. Notificações são apenas no sistema (em tempo real via WebSocket). Email pode ser implementado no futuro.

### Q: Posso desativar certos tipos de notificação?
**R:** Atualmente não há configuração granular. Todas as notificações relevantes são enviadas automaticamente.

### Q: Por que não recebi notificação de uma tarefa?
**R:** Verifique: 1) Se você é responsável ou mencionado, 2) Se estava conectado quando notificação foi enviada, 3) Se não marcou como lida acidentalmente.

### Q: Quanto tempo as notificações ficam salvas?
**R:** Indefinidamente, até que você exclua manualmente. Use "Marcar todas como lidas" para organizar.

### Q: Notificações aparecem quando sistema está fechado?
**R:** Não. Você precisa estar com o navegador aberto e conectado para receber notificações em tempo real.

### Q: Como desativo som de notificações?
**R:** Depende das configurações do seu navegador. Chrome/Firefox: Configurações → Privacidade → Notificações → Bloquear para este site.

### Q: Posso ver notificações antigas?
**R:** Sim, acesse Menu → "Notificações" para ver todo histórico. Notificações não expiram.

---

## 🤖 Chat IA

### Q: A IA tem acesso aos meus dados do sistema?
**R:** Não. A IA só vê o que você compartilha manualmente no chat. Não acessa banco de dados ou suas informações privadas.

### Q: As conversas são salvas?
**R:** Sim, no seu histórico pessoal. Outros usuários não veem suas conversas. Histórico é privado por usuário.

### Q: Posso confiar 100% nas respostas da IA?
**R:** A IA é muito precisa mas pode cometer erros. **Sempre valide informações críticas** (valores, datas, decisões importantes).

### Q: Há custo por uso da IA?
**R:** Depende da configuração da sua organização. Alguns planos podem ter limite de tokens. Pergunte ao administrador.

### Q: A IA responde em português?
**R:** Sim! O sistema está configurado para português brasileiro por padrão.

### Q: Posso usar IA para gerar contratos legais?
**R:** Não recomendado. Use IA apenas para rascunhos e sugestões. Documentos legais devem ser revisados por profissionais qualificados.

### Q: Por que recebi "limite de requisições atingido"?
**R:** Você fez mais de 100 requisições em 1 minuto (rate limit). Aguarde 60 segundos para continuar.

### Q: IA pode analisar qualquer tipo de imagem?
**R:** Sim, mas com limitações: máximo 10MB, formatos JPG/PNG/GIF. Funciona melhor com fotos nítidas e bem iluminadas.

### Q: Posso deletar meu histórico de chat?
**R:** Atualmente não há função de deletar. Histórico é mantido no servidor para referência.

---

## 🔧 Problemas Técnicos

### Q: Sistema não carrega, tela fica branca
**R:** 1) Atualize a página (F5), 2) Limpe cache (Ctrl+Shift+Delete), 3) Tente outro navegador, 4) Verifique conexão.

### Q: Erro 404 "Página não encontrada"
**R:** Verifique a URL. Use navegação do sistema ao invés de digitar endereços manualmente.

### Q: Upload de arquivo sempre falha
**R:** Verifique: 1) Tamanho < 10MB, 2) Formato suportado (JPG, PNG, PDF, DOC, XLS), 3) Conexão estável.

### Q: Sistema está muito lento
**R:** 1) Feche abas não usadas, 2) Limpe cache, 3) Desative extensões do navegador, 4) Teste velocidade da internet.

### Q: Botões não respondem aos cliques
**R:** 1) Aguarde carregamento completo da página, 2) Atualize (F5), 3) Limpe cache, 4) Tente outro navegador.

### Q: Dados não salvam
**R:** 1) Verifique conexão com internet, 2) Preencha todos campos obrigatórios (*), 3) Veja se há mensagens de erro, 4) Tente novamente.

### Q: Print não funciona
**R:** Use Ctrl+P ou botão de impressão do navegador. Verifique se pop-ups não estão bloqueados.

### Q: Qual navegador devo usar?
**R:** Recomendados: **Chrome 100+**, **Firefox 100+**, **Edge 100+**. Não suportado: Internet Explorer.

### Q: Como limpo cache do navegador?
**R:** Pressione **Ctrl+Shift+Delete**, selecione "Últimas 24 horas" e "Imagens e arquivos em cache", depois clique em "Limpar".

### Q: Sistema funciona em tablet/iPad?
**R:** Sim, mas algumas funcionalidades são otimizadas para desktop. Use navegador atualizado (Safari, Chrome).

---

## 📊 Relatórios e Dashboards

### Q: Como exporto relatórios?
**R:** Atualmente não há exportação automática. Use print (Ctrl+P) ou tire screenshots. Exportação PDF/Excel pode ser implementada no futuro.

### Q: Posso criar dashboards personalizados?
**R:** Não. Dashboards são fixos por tipo de usuário. Administradores podem solicitar customizações ao desenvolvedor.

### Q: Dados dos gráficos estão desatualizados
**R:** Atualize a página (F5). Gráficos carregam dados em tempo real ao abrir a página.

### Q: Posso filtrar relatórios por múltiplos critérios?
**R:** Depende do relatório. A maioria permite filtro por período, unidade, setor e responsável.

---

## 🔐 Segurança e Privacidade

### Q: Meus dados estão seguros?
**R:** Sim. Sistema usa HTTPS, JWT tokens, sessões com timeout, e banco de dados protegido.

### Q: Quem pode ver minhas atividades?
**R:** Administradores têm visão completa. Colegas veem apenas informações compartilhadas (tarefas atribuídas, empresas comuns, etc.).

### Q: Posso usar VPN para acessar?
**R:** Sim, mas pode haver lentidão. Verifique com seu administrador se VPN é necessária.

### Q: Sistema tem log de auditoria?
**R:** Sim, sistema registra acessos e ações principais. Administradores podem consultar logs em caso de necessidade.

### Q: Como reporto problema de segurança?
**R:** Entre em contato imediatamente com seu administrador ou equipe de TI. Não compartilhe detalhes publicamente.

---

## 💡 Melhores Práticas

### Q: Qual a melhor forma de organizar minhas tarefas?
**R:** 1) Atualize status diariamente, 2) Use comentários para documentar progresso, 3) Priorize por urgência/importância, 4) Use filtros da agenda.

### Q: Como otimizo uso do sistema?
**R:** 1) Memorize Ctrl+K para busca, 2) Use filtros ao invés de rolar listas longas, 3) Abra múltiplas abas para trabalho paralelo, 4) Configure notificações do navegador.

### Q: Devo usar Livro de Registros para tudo?
**R:** Use para: ligações, emails, reuniões, negociações. Não use para: anotações pessoais, lembretes internos (use comentários em tarefas).

### Q: Como mantenho dados de qualidade?
**R:** 1) Padronize nomenclatura, 2) Preencha campos opcionais quando relevante, 3) Atualize informações regularmente, 4) Use observações para detalhes importantes.

---

## 🎓 Treinamento e Suporte

### Q: Onde encontro tutoriais?
**R:** [Documentação Completa](DOCUMENTACAO_USUARIO.md) tem tutoriais passo a passo. [Guia Rápido](GUIA_RAPIDO.md) tem resumos.

### Q: Há treinamentos presenciais?
**R:** Depende da sua organização. Consulte RH ou seu administrador sobre disponibilidade de treinamentos.

### Q: Posso sugerir melhorias?
**R:** Sim! Fale com seu administrador ou use canal de feedback da sua organização.

### Q: Sistema receberá atualizações?
**R:** Sim. Acompanhe em Menu → "Changelog" para ver novidades e correções.

---

## 📞 Contato e Suporte

### Q: Como entro em contato com suporte?
**R:** 1) Consulte este FAQ, 2) Use Chat IA, 3) Fale com administrador local, 4) Email/telefone fornecidos pela organização.

### Q: Qual o horário de suporte?
**R:** Verifique com sua organização. Geralmente: Segunda a Sexta, 8h-18h (horário local).

### Q: Problemas fora do horário, o que faço?
**R:** Documente o problema (screenshots), tente soluções do FAQ, e reporte no próximo dia útil.

---

**Não encontrou sua pergunta?** Consulte a [Documentação Completa](DOCUMENTACAO_USUARIO.md) ou pergunte ao [Chat IA 🤖](javascript:void(0))

---

**FAQ Completo - Sistema Mirai** | v1.0 | Dezembro 2024

**💡 Dica:** Use Ctrl+F para buscar palavras-chave neste documento!
