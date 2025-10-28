# Guia de Deploy no AWS Lightsail

Este documento descreve como preparar, implantar e manter seu projeto (React + Node/Express + Socket.IO + MySQL + uploads) no AWS Lightsail. Inclui opções de arquitetura, decisões sobre bucket (S3) e scripts de operação.

---
## 1. Arquiteturas Possíveis
| Opção | Descrição | Quando usar | Prós | Contras |
|-------|-----------|-------------|------|---------|
| A | 1 instância Lightsail (app + MySQL juntos) | MVP / testes | Simples / barato | Risco em caso de falha / sem backups automáticos de DB |
| B | App em 1 instância + Banco Gerenciado Lightsail (MySQL) | Produção básica | Backups automáticos | Custo maior |
| C | App em 1 instância + DB gerenciado + S3 uploads + Nginx | Crescimento | Separação / escalável | Mais complexidade |
| D | App em 2+ instâncias + LB + DB gerenciado + S3 | Escala | Alta disponibilidade | Custo + gerência |

Recomendação inicial: **Opção B**.

---
## 2. Criação de Recursos
### 2.1 Instância Lightsail
1. Acesse Lightsail > Create Instance.
2. Plataforma: Linux/Unix.
3. Blueprint: OS Only (Ubuntu 22.04 LTS).
4. Plano: $10 (1GB) ou $20 (2GB) se espera mais conexão WebSocket.
5. Nome: `mirai-app`.
6. Crie e anote o IP público. (Depois associe um Static IP.)

### 2.2 Banco (se usar Gerenciado)
1. Lightsail > Databases > Create.
2. MySQL 8.x.
3. Plano Dev/Test (1 GB) inicialmente.
4. Aponte o endpoint gerado (ex: `ls-xxxxxx.ceyz....lightsail.aws.com`).
5. Anote usuário master + senha.
6. Crie o banco com o nome esperado (`MYSQL_DATABASE`).

> Se optar por DB na mesma instância: instale MySQL local (`apt install mysql-server`) e configure usuário/senha.

### 2.3 (Opcional) S3 para uploads
Você **não é obrigado** a usar bucket agora. Critérios:
- Uploads pequenos / poucos arquivos: usar `server/uploads` local.
- Necessário persistência em caso de reinstância, escalabilidade ou CDN: migrar para S3.

#### Criar bucket (quando migrar):
1. S3 > Create Bucket (ex: `mirai-uploads-prod`).
2. Região igual ou próxima da instância.
3. Bloqueie acesso público (usar URLs assinadas ou CloudFront depois se necessário).
4. Crie um usuário IAM com política mínima:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:PutObject","s3:GetObject","s3:DeleteObject"], "Resource": ["arn:aws:s3:::mirai-uploads-prod/*"] }
  ]
}
```
5. Salve Access Key/Secret e exporte como variáveis (no futuro adicionar SDK, ainda não implementado no código atual).

---
## 3. Acesso à Instância
SSH na instância:
```bash
ssh -i sua_chave.pem ubuntu@SEU_IP
```

Atualize pacotes:
```bash
sudo apt update && sudo apt upgrade -y
```

Instale utilitários:
```bash
sudo apt install -y git build-essential curl unzip
```

Instale Node (via nvm):
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20
node -v
```

---
## 4. Clonar e Construir o Projeto
```bash
cd ~
git clone https://github.com/SEU_USUARIO/mirai-react.git
cd mirai-react
npm install 
npm --prefix server install
npm run build:full
```

Estrutura resultante:
```
mirai-react/
  dist/                 # Frontend build
  server/dist/          # Backend compilado
  server/uploads/       # Persistir (criar se não existir)
```

Permissões para uploads:
```bash
mkdir -p server/uploads
chmod 775 server/uploads
```

---
## 5. Variáveis de Ambiente
Crie `server/.env` (NÃO commitar):
```
PORT=5000
SERVE_FRONT=true
MYSQL_HOST=endpoint-ou-localhost
MYSQL_PORT=3306
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=seu_banco
JWT_SECRET=uma_chave_grande_unica
JWT_EXPIRES_IN=4h
```

Se usar DB local, test rapidamente:
```bash
mysql -u MYSQL_USER -p
```

---
## 6. Executar o Backend
Teste manual:
```bash
node server/dist/server.js
```
Acesse: `http://IP_PUBLICO:5000/` – deve servir o frontend.

### 6.1 Reverse Proxy com Nginx (opcional mas recomendado)
Instale Nginx:
```bash
sudo apt install -y nginx
```
Arquivo `/etc/nginx/sites-available/mirai`:
```
server {
  server_name seu-dominio.com;
  listen 80;

  location /socket.io/ {
    proxy_pass http://127.0.0.1:5000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:5000/api/;
    proxy_set_header Host $host;
  }

  location / {
    proxy_pass http://127.0.0.1:5000/;
    proxy_set_header Host $host;
  }
}
```
Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/mirai /etc/nginx/sites-enabled/mirai
sudo nginx -t && sudo systemctl reload nginx
```

### 6.2 SSL (Certbot)
```bash
sudo snap install core; sudo snap refresh core
sudo apt remove certbot -y || true
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```
Renovação automática já é configurada.

---
## 7. PM2 ou systemd para rodar em produção
### Usando PM2
```bash
npm install -g pm2
pm2 start server/dist/server.js --name mirai
pm2 save
pm2 startup
```
Logs:
```bash
pm2 logs mirai
```

### Usando systemd (alternativa)
Crie `/etc/systemd/system/mirai.service`:
```
[Unit]
Description=Mirai App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mirai-react
Environment=PORT=5000
Environment=SERVE_FRONT=true
Environment=MYSQL_HOST=...
Environment=MYSQL_USER=...
Environment=MYSQL_PASSWORD=...
Environment=MYSQL_DATABASE=...
ExecStart=/home/ubuntu/.nvm/versions/node/v20.*/bin/node server/dist/server.js
Restart=always

[Install]
WantedBy=multi-user.target
```
Ativar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mirai --now
sudo systemctl status mirai
```

---
## 8. Backups & Snapshots
- **Instância**: tirar snapshot manual (Console Lightsail > Snapshots) 1x/dia ou antes de deploy arriscado.
- **Banco Gerenciado**: backups automáticos Lightsail (defina janela) + snapshot manual antes de migrações.
- **Uploads locais**: se críticos, rsync para S3 periodicamente:
```bash
aws s3 sync server/uploads s3://mirai-uploads-prod/uploads --delete
```
(Cria usuário IAM + instala AWS CLI.)

---
## 9. Monitoramento Básico
| Métrica | Como ver | Ação quando alto |
|---------|----------|------------------|
| CPU | Console Lightsail | Aumentar plano ou otimizar |
| RAM | `htop` / Lightsail | Subir plano / reduzir dependências |
| Latência MySQL | Logs / profiling consultas | Índices / separar DB |
| WebSocket quedas | Logs do Node | Checar reverse proxy / limites FD |

Adicionar endpoint de health (já existe `/api/health`).

---
## 10. Migração de Uploads para S3 (quando necessário)
1. Criar bucket (como seção 2.3).
2. Instalar AWS SDK: `npm install aws-sdk` (ou v3 modular: `@aws-sdk/client-s3`).
3. Criar serviço `s3UploadService.ts` e trocar uso do `fs` nos uploads.
4. Armazenar somente chave/URL no banco.

> Pode implementar progressivamente: manter local e enviar para S3 em segundo plano.

---
## 11. Deploy de Atualizações
Script de atualização simples (PM2):
```bash
cd ~/mirai-react
git pull origin main
npm install
npm --prefix server install
npm run build:full
pm2 restart mirai
```
Ou systemd:
```bash
cd ~/mirai-react && git pull origin main && npm install && npm --prefix server install && npm run build:full && sudo systemctl restart mirai
```

### 11.1 Deploy enviando apenas artefatos (build local)
Quando a instância tem pouca RAM (ex: 512 MB) e o build é “Killed”:

1. No seu computador (local):
```bash
git pull origin main
npm install
npm run build:full   # gera dist/ e server/dist/
tar czf deploy.tar.gz dist server/dist server/templates package.json server/package.json
```
2. Envie para o servidor:
```bash
scp deploy.tar.gz ubuntu@SEU_IP:~/mirai-react/
```
3. No servidor:
```bash
cd ~/mirai-react
tar xzf deploy.tar.gz
npm --prefix server install --omit=dev
pm2 restart mirai || pm2 start server/dist/server.js --name mirai
```
4. Limpeza opcional:
```bash
rm deploy.tar.gz
```

Script automatizado local (`scripts/deploy-upload.sh` sugerido):
```bash
#!/usr/bin/env bash
set -e
APP_DIR=mirai-react

echo "[1] Atualizando repo"
git pull --rebase

echo "[2] Instalando deps"
npm install
npm run build:full

echo "[3] Empacotando artefatos"
tar czf deploy.tar.gz dist server/dist server/templates package.json server/package.json

echo "[4] Enviando para servidor"
scp deploy.tar.gz ubuntu@SEU_IP:~/mirai-react/

echo "[5] Aplicando no servidor"
ssh ubuntu@SEU_IP 'cd ~/mirai-react && tar xzf deploy.tar.gz && npm --prefix server install --omit=dev && (pm2 restart mirai || pm2 start server/dist/server.js --name mirai) && rm deploy.tar.gz'

echo "Deploy concluído."
```
Lembre de substituir `SEU_IP` e garantir chave SSH configurada.

---
## 12. Resolução de Problemas
| Sintoma | Causa Comum | Solução |
|---------|-------------|---------|
| 404 em `/` | Build não gerado ou SERVE_FRONT desligado | `npm run build:full` + conferir variáveis |
| Socket.IO não conecta | Proxy sem upgrade | Checar Nginx bloco `/socket.io/` |
| ER_ACCESS_DENIED | Usuário MySQL incorreto ou host incorreto | Grant correto / Endpoint gerenciado |
| Upload não salva | Permissão pasta | `chmod 775 server/uploads` |
| Alto consumo memória | Build grande + dependências | Subir plano ou revisar libs |

---
## 13. Roadmap Futuro
- Mover uploads para S3.
- Implementar cache (Redis) se contadores / presença aumentar.
- Autoscaling via ECS/Fargate se tráfego crescer muito.
- Logging estruturado (pino) + centralização (CloudWatch / Loki).

---
## 14. Resumo Rápido (TL;DR)
1. Criar instância (Ubuntu + $10 ou $20).
2. Clonar repo e instalar dependências.
3. `npm run build:full`.
4. Criar `.env` em `server/` + `SERVE_FRONT=true`.
5. `pm2 start server/dist/server.js` ou systemd.
6. (Opcional) Nginx + SSL com Certbot.
7. Snapshots regulares.
8. Planejar migração para S3 depois.

---
Dúvidas ou deseja que eu gere scripts automatizados (ex: `deploy.sh`)? Abra um pedido e eu adiciono.
