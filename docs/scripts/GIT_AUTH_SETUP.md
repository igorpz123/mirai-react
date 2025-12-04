# 🔐 Configurar Autenticação Git no Servidor

## ⚡ Solução Rápida (2 opções)

---

## 🔑 **OPÇÃO 1: SSH (Recomendado)**

### **1. Gerar chave SSH no servidor**

```bash
# Conectar no servidor
ssh -i sua-chave.pem ubuntu@SEU_IP

# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Pressione Enter 3x (sem senha)
```

### **2. Copiar chave pública**

```bash
cat ~/.ssh/id_ed25519.pub
```

Copie TODO o texto que aparecer (começa com `ssh-ed25519`).

### **3. Adicionar no GitHub**

1. Acesse: https://github.com/settings/keys
2. Clique em **"New SSH key"**
3. Cole a chave
4. Salve

### **4. Testar conexão**

```bash
ssh -T git@github.com
```

Deve aparecer: `Hi igorpz123! You've successfully authenticated`

### **5. Executar deploy**

```bash
bash deploy-application.sh
```

✅ **Pronto! Deve funcionar agora.**

---

## 🎫 **OPÇÃO 2: Personal Access Token**

### **1. Criar token no GitHub**

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token (classic)"**
3. Configure:
   - Nome: `Deploy Mirai Server`
   - Expiration: `No expiration` (ou escolha prazo)
   - Scopes: Marque apenas `repo` (acesso completo a repositórios)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você não verá novamente!)

### **2. Editar script de deploy**

No servidor:

```bash
nano deploy-application.sh
```

Encontre estas linhas no início:

```bash
# OPÇÃO 1: SSH (recomendado se você tem chave SSH configurada no GitHub)
REPO_URL="git@github.com:igorpz123/mirai-react.git"

# OPÇÃO 2: HTTPS com Personal Access Token
# REPO_URL="https://SEU_TOKEN@github.com/igorpz123/mirai-react.git"
```

**Comente** a linha SSH e **descomente** a linha do token:

```bash
# OPÇÃO 1: SSH (recomendado se você tem chave SSH configurada no GitHub)
# REPO_URL="git@github.com:igorpz123/mirai-react.git"

# OPÇÃO 2: HTTPS com Personal Access Token
REPO_URL="https://ghp_xxxxxxxxxxxxxxxxxxxxx@github.com/igorpz123/mirai-react.git"
```

Substitua `ghp_xxxxxxxxxxxxxxxxxxxxx` pelo seu token real.

### **3. Salvar e executar**

```bash
# Ctrl+O para salvar
# Ctrl+X para sair
bash deploy-application.sh
```

---

## 🌍 **OPÇÃO 3: Tornar Repositório Público (Não Recomendado)**

Se você quiser tornar o repositório público:

1. Acesse: https://github.com/igorpz123/mirai-react/settings
2. Role até **"Danger Zone"**
3. Clique em **"Change visibility"**
4. Escolha **"Public"**

⚠️ **Cuidado:** Qualquer pessoa poderá ver seu código!

Depois, edite o script:

```bash
REPO_URL="https://github.com/igorpz123/mirai-react.git"
```

---

## 🎯 **Qual Opção Escolher?**

| Opção | Segurança | Dificuldade | Recomendado |
|-------|-----------|-------------|-------------|
| **SSH** | ⭐⭐⭐⭐⭐ | Fácil | ✅ **SIM** |
| **Token** | ⭐⭐⭐⭐ | Muito fácil | ✅ OK |
| **Público** | ⚠️ Baixa | Muito fácil | ❌ Não |

**Recomendação:** Use **SSH** (Opção 1).

---

## 🆘 Troubleshooting

### **Erro: Permission denied (publickey)**

Significa que a chave SSH não foi adicionada corretamente.

**Solução:**
```bash
# Ver sua chave pública
cat ~/.ssh/id_ed25519.pub

# Testar conexão
ssh -T git@github.com -v
```

Verifique se a chave está no GitHub.

---

### **Erro: Authentication failed**

Com token, significa que:
- Token inválido
- Token expirou
- Token sem permissão `repo`

**Solução:** Gere novo token com permissão `repo`.

---

### **Já existe pasta /home/ubuntu/mirai**

Se der erro porque a pasta já existe:

```bash
# Remover pasta antiga
rm -rf /home/ubuntu/mirai

# Executar deploy novamente
bash deploy-application.sh
```

---

## ✅ Verificação Final

Depois de configurar:

```bash
# Testar Git
cd /home/ubuntu
git clone git@github.com:igorpz123/mirai-react.git test-repo

# Se clonar com sucesso:
rm -rf test-repo
echo "✅ Git configurado corretamente!"
```

---

## 📝 Resumo Rápido

```bash
# 1. Gerar chave
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# 2. Ver chave
cat ~/.ssh/id_ed25519.pub

# 3. Adicionar em: https://github.com/settings/keys

# 4. Testar
ssh -T git@github.com

# 5. Deploy
bash deploy-application.sh
```

🎉 **Pronto para deploy!**
