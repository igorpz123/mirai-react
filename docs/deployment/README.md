# 🚀 Documentação de Deployment

Esta pasta contém guias e configurações para deploy do projeto em produção.

## 📚 Arquivos Disponíveis

### [DEPLOY_LIGHTSAIL.md](DEPLOY_LIGHTSAIL.md) 📖
**Guia completo de deploy em AWS Lightsail**

Instruções detalhadas para:
- Configuração inicial do servidor
- Instalação de dependências (Node.js, MySQL, Nginx)
- Setup de ambiente de produção
- Configuração de domínio e SSL
- Scripts de deploy automatizados

**Para quem:** DevOps e desenvolvedores fazendo deploy em produção.

---

### Configurações do Nginx

#### [nginx-mirai.conf](nginx-mirai.conf)
Configuração original do Nginx para o projeto Mirai.

**Inclui:**
- Proxy reverso para API (porta 5000)
- Servir arquivos estáticos
- Configuração de uploads
- Headers de segurança

#### [nginx-mirai-fixed.conf](nginx-mirai-fixed.conf)
Configuração corrigida/atualizada do Nginx.

**Melhorias:**
- Correções de performance
- Otimizações de cache
- Headers atualizados
- Melhor tratamento de erros

**Recomendação:** Use esta versão para novos deploys.

---

### [.htaccess](.htaccess)
Configuração para servidores Apache (alternativa ao Nginx).

**Inclui:**
- Regras de rewrite para SPA
- Configuração de CORS
- Cache control
- Compressão Gzip

---

## 🚀 Deploy Rápido

### Pré-requisitos
- Servidor Ubuntu 20.04+ ou similar
- Node.js 18+ instalado
- MySQL 8+ instalado
- Nginx ou Apache

### Passos Básicos

```bash
# 1. Clonar repositório
git clone <repo-url>
cd mirai-react

# 2. Instalar dependências
npm run install:all

# 3. Configurar ambiente
cp config/.env.example server/.env
# Editar server/.env com credenciais de produção

# 4. Build de produção
npm run build:full

# 5. Iniciar servidor
cd server
SERVE_FRONT=true npm start
```

---

## ⚙️ Configuração do Nginx

### Instalação

```bash
# Copiar configuração
sudo cp docs/deployment/nginx-mirai-fixed.conf /etc/nginx/sites-available/mirai
sudo ln -s /etc/nginx/sites-available/mirai /etc/nginx/sites-enabled/

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

### Estrutura da Config

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    # Frontend (SPA)
    location / {
        root /path/to/mirai-react/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
    
    # Uploads
    location /uploads {
        alias /path/to/mirai-react/server/uploads;
    }
}
```

---

## 🔧 Scripts de Deploy

Scripts PowerShell disponíveis em `/scripts`:

### `deploy-all.ps1`
Deploy completo (frontend + backend + banco).

```powershell
# Uso
.\scripts\deploy-all.ps1
```

### `deploy-frontend.ps1`
Deploy apenas do frontend.

```powershell
# Build e deploy do frontend
.\scripts\deploy-frontend.ps1
```

### `deploy-backend.ps1`
Deploy apenas do backend.

```powershell
# Build e restart do backend
.\scripts\deploy-backend.ps1
```

### `deploy-uploads.ps1`
Sync de arquivos de upload.

```powershell
# Sincronizar pasta uploads
.\scripts\deploy-uploads.ps1
```

---

## 🛡️ Segurança em Produção

### Variáveis de Ambiente
```env
NODE_ENV=production
SERVE_FRONT=true
FRONT_DIST_PATH=../dist

# JWT - Use segredo forte e único
JWT_SECRET=<gere-uma-string-aleatoria-forte>

# Database - Use credenciais dedicadas
MYSQL_HOST=localhost
MYSQL_USER=mirai_prod
MYSQL_PASSWORD=<senha-forte>
MYSQL_DATABASE=mirai_prod
```

### Checklist de Segurança
- [ ] JWT_SECRET único e forte (min. 32 caracteres)
- [ ] Credenciais de banco dedicadas (não use root)
- [ ] HTTPS configurado com SSL/TLS
- [ ] Firewall configurado (apenas portas 80, 443, 22)
- [ ] Rate limiting habilitado
- [ ] CORS configurado corretamente
- [ ] Logs de erro monitorados
- [ ] Backups automatizados do banco

---

## 📊 Monitoramento

### Logs do Servidor
```bash
# Logs do backend
pm2 logs mirai-server

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Check
```bash
# Verificar status da API
curl http://localhost:5000/api/health

# Verificar frontend
curl http://localhost/
```

### PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
cd /path/to/mirai-react/server
pm2 start npm --name "mirai-server" -- start

# Configurar startup automático
pm2 startup
pm2 save

# Monitoramento
pm2 monit
pm2 status
```

---

## 🔄 Atualizações

### Deploy de Novas Versões

```bash
# 1. Baixar atualizações
cd /path/to/mirai-react
git pull origin main

# 2. Instalar novas dependências
npm run install:all

# 3. Build
npm run build:full

# 4. Restart
pm2 restart mirai-server

# 5. Verificar
curl http://localhost:5000/api/health
```

### Rollback
```bash
# Voltar para commit anterior
git checkout <commit-hash>
npm run build:full
pm2 restart mirai-server
```

---

## 🆘 Troubleshooting

### Servidor não inicia
```bash
# Verificar logs
pm2 logs mirai-server

# Verificar porta em uso
sudo lsof -i :5000

# Reiniciar
pm2 restart mirai-server
```

### Frontend retorna 404
```bash
# Verificar build do frontend
ls -la dist/

# Verificar config do Nginx
sudo nginx -t
cat /etc/nginx/sites-enabled/mirai
```

### API retorna 502 Bad Gateway
```bash
# Backend está rodando?
pm2 status

# Porta correta no Nginx?
grep proxy_pass /etc/nginx/sites-enabled/mirai
```

---

## 📚 Recursos Adicionais

- [Guia oficial AWS Lightsail](https://lightsail.aws.amazon.com/ls/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

## 📝 Notas

**Ambientes Suportados:**
- AWS Lightsail (recomendado)
- DigitalOcean Droplets
- VPS Linux genérico (Ubuntu/Debian)
- Heroku (com adaptações)

**Requisitos Mínimos:**
- 1 GB RAM
- 1 vCPU
- 25 GB SSD
- Ubuntu 20.04+

---

📚 Para mais detalhes, veja [documentação completa](../INDEX.md).
