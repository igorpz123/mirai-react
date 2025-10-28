# ⚙️ Configuração do Projeto

Esta pasta contém arquivos de configuração do projeto.

## 📄 Arquivos

### `.env.example`
Template de variáveis de ambiente para o projeto.

**Como usar:**
1. Copie este arquivo para `server/.env`:
   ```bash
   cp config/.env.example server/.env
   ```

2. Edite `server/.env` com suas credenciais:
   ```env
   # Database
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=sua_senha_aqui
   MYSQL_DATABASE=mirai
   
   # Auth
   JWT_SECRET=seu_segredo_jwt_aqui
   
   # AI (opcional - para integração com Google Gemini)
   GEMINI_API_KEY=sua_chave_api_aqui
   GEMINI_MODEL=gemini-2.5-flash
   ```

**Variáveis importantes:**
- `MYSQL_*` - Credenciais do banco de dados MySQL
- `JWT_SECRET` - Segredo para assinatura de tokens JWT (use string aleatória forte)
- `GEMINI_API_KEY` - Chave de API do Google Gemini (veja [docs/ai/GEMINI_API_KEY_GUIDE.md](../docs/ai/GEMINI_API_KEY_GUIDE.md))
- `GEMINI_MODEL` - Modelo a usar (recomendado: `gemini-2.5-flash`)

### `components.json`
Configuração dos componentes UI (Radix UI + Tailwind CSS).

**Inclui:**
- Aliases de paths (`@/`)
- Estilo de componentes
- Configuração do Tailwind
- Base URL para componentes

Este arquivo é usado pelo CLI de componentes para gerar e instalar componentes UI.

## 🔒 Segurança

⚠️ **NUNCA** commite arquivos `.env` com credenciais reais!

- ✅ `.env.example` - Template sem valores sensíveis (pode commitar)
- ❌ `.env` - Arquivo com credenciais reais (já está no .gitignore)

## 📚 Documentação Relacionada

- [Guia de Setup da IA](../docs/ai/AI_SETUP.md)
- [Guia de API Key do Gemini](../docs/ai/GEMINI_API_KEY_GUIDE.md)
- [Deploy Lightsail](../docs/deployment/DEPLOY_LIGHTSAIL.md)
