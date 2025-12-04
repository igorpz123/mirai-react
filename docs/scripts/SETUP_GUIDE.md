# 🚀 Guia de Setup - Nova Instância

## 📋 Pré-requisitos

- Instância criada a partir do snapshot
- Acesso SSH à instância
- IP público da instância
- Domínio configurado (opcional, para SSL)

---

## ⚡ Setup Rápido (Passo a Passo)

### 1️⃣ **Conectar via SSH**

```bash
ssh -i sua-chave.pem ubuntu@SEU_IP
```

### 2️⃣ **Baixar Scripts de Setup**

Copie os scripts para o servidor:

```bash
cd ~
mkdir -p scripts
cd scripts
```

Faça upload dos 4 scripts desta pasta ou crie-os diretamente no servidor.

### 3️⃣ **Dar Permissão de Execução**

```bash
chmod +x setup-new-instance.sh
chmod +x setup-mysql-database.sh
chmod +x deploy-application.sh
chmod +x setup-nginx-config.sh
```

---

## 🎯 Execução em Ordem

### **Script 1: Setup Inicial** (15-20 minutos)

Instala Node.js, MySQL, Nginx, PM2 e configura firewall.

```bash
bash setup-new-instance.sh
```

**O que faz:**
- ✅ Atualiza sistema
- ✅ Instala Node.js 20.x
- ✅ Instala MySQL Server
- ✅ Instala PM2 (process manager)
- ✅ Instala Nginx
- ✅ Configura firewall
- ✅ Cria estrutura de pastas

---

### **Script 2: Configurar MySQL** (5 minutos)

Cria banco de dados e usuário.

```bash
bash setup-mysql-database.sh
```

⚠️ **ANTES DE EXECUTAR:**
1. Edite o script e mude as senhas:
   ```bash
   nano setup-mysql-database.sh
   ```
2. Altere estas linhas:
   ```bash
   DB_PASSWORD="SuaSenhaForteAqui123!"  # ⚠️ MUDE ISSO!
   ROOT_PASSWORD="SuaSenhaRootAqui123!" # ⚠️ MUDE ISSO!
   ```

**O que faz:**
- ✅ Configura senha root do MySQL
- ✅ Cria database `mirai_db`
- ✅ Cria usuário `mirai_user`
- ✅ Configura permissões
- ✅ Configura backup automático diário
- ✅ Cria arquivo `.env` com credenciais

**Salve as credenciais:**
- Database: `mirai_db`
- Usuário: `mirai_user`
- Senha: a que você definiu

---

### **Script 3: Deploy da Aplicação** (10-15 minutos)

Clona repositório, instala dependências e inicia aplicação.

```bash
bash deploy-application.sh
```

⚠️ **ANTES DE EXECUTAR:**
1. Edite o script e ajuste a URL do repositório:
   ```bash
   nano deploy-application.sh
   ```
2. Altere esta linha:
   ```bash
   REPO_URL="https://github.com/igorpz123/mirai-react.git"  # ⚠️ AJUSTE AQUI
   ```

**O que faz:**
- ✅ Clona/atualiza repositório
- ✅ Instala dependências (npm install)
- ✅ Builda backend (TypeScript)
- ✅ Builda frontend (React)
- ✅ Copia arquivos para `/var/www/mirai/`
- ✅ Inicia aplicação com PM2

---

### **Script 4: Configurar Nginx** (5 minutos)

Configura proxy reverso e SSL.

```bash
bash setup-nginx-config.sh
```

**Durante a execução:**
1. Digite seu domínio quando solicitado
2. Escolha se quer configurar SSL (HTTPS)

**O que faz:**
- ✅ Cria configuração do Nginx
- ✅ Configura proxy para backend
- ✅ Configura servir frontend
- ✅ Configura SSL/HTTPS (se escolhido)
- ✅ Ativa e testa configuração

---

## ✅ Verificação

Após executar todos os scripts:

### 1. **Verificar MySQL**
```bash
mysql -u mirai_user -p mirai_db
# Digite a senha quando solicitado
```

### 2. **Verificar Backend**
```bash
pm2 status
pm2 logs mirai-backend --lines 50
```

### 3. **Verificar Nginx**
```bash
sudo systemctl status nginx
sudo nginx -t
```

### 4. **Testar no Navegador**
```
http://SEU_DOMINIO
```

---

## 🔧 Comandos Úteis

### **PM2 (Backend)**
```bash
pm2 status                    # Ver status
pm2 logs mirai-backend        # Ver logs em tempo real
pm2 restart mirai-backend     # Reiniciar aplicação
pm2 stop mirai-backend        # Parar aplicação
pm2 monit                     # Monitor de recursos
```

### **MySQL**
```bash
# Conectar
mysql -u mirai_user -p mirai_db

# Backup manual
/home/ubuntu/backup-mysql.sh

# Ver backups
ls -lh ~/backups/
```

### **Nginx**
```bash
# Status
sudo systemctl status nginx

# Recarregar configuração
sudo systemctl reload nginx

# Testar configuração
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/mirai_access.log
sudo tail -f /var/log/nginx/mirai_error.log
```

---

## 🔒 Segurança

### **Firewall Configurado:**
- ✅ Porta 22 (SSH)
- ✅ Porta 80 (HTTP)
- ✅ Porta 443 (HTTPS)

### **MySQL:**
- ✅ Apenas conexões locais permitidas
- ✅ Usuário com senha forte
- ✅ Root com senha configurada

### **Backups:**
- ✅ Backup automático diário às 3h
- ✅ Mantém últimos 7 dias
- ✅ Compactado com gzip

---

## 🆘 Troubleshooting

### **Backend não inicia:**
```bash
# Ver logs detalhados
pm2 logs mirai-backend --lines 100

# Verificar arquivo .env
cat /var/www/mirai/backend/.env

# Reiniciar
pm2 restart mirai-backend
```

### **Erro de conexão com MySQL:**
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Testar conexão
mysql -u mirai_user -p -e "SELECT 1"

# Ver logs do MySQL
sudo tail -f /var/log/mysql/error.log
```

### **Nginx não carrega site:**
```bash
# Testar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Verificar permissões
ls -la /var/www/mirai/frontend/
```

### **SSL não funciona:**
```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Testar renovação
sudo certbot renew --dry-run
```

---

## 📊 Monitoramento

### **Recursos do Sistema:**
```bash
# CPU e memória
htop

# Disco
df -h

# Processos Node.js
pm2 monit

# Conexões ativas
sudo netstat -tulpn | grep LISTEN
```

---

## 🔄 Deploy de Atualizações

Quando precisar atualizar a aplicação:

```bash
# Opção 1: Executar script de deploy novamente
bash deploy-application.sh

# Opção 2: Manual
cd ~/mirai
git pull origin main
cd server && npm install && npm run build
cd .. && npm install && npm run build
pm2 restart mirai-backend
```

---

## 📝 Checklist Final

Após setup completo, verifique:

- [ ] MySQL instalado e rodando
- [ ] Database `mirai_db` criado
- [ ] Backend rodando via PM2
- [ ] Frontend acessível via Nginx
- [ ] DNS apontando para IP correto
- [ ] SSL/HTTPS configurado (opcional)
- [ ] Backup automático agendado
- [ ] Firewall ativo e configurado
- [ ] Logs sem erros

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique logs: `pm2 logs mirai-backend`
2. Verifique Nginx: `sudo nginx -t`
3. Verifique MySQL: `sudo systemctl status mysql`
4. Verifique firewall: `sudo ufw status`

---

**Tempo total estimado: 40-50 minutos**

🎉 **Pronto! Sua aplicação está online!**
