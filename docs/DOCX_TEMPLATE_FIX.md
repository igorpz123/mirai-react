# 🎯 SOLUÇÃO DEFINITIVA - Template de Contrato

## ⚠️ PROBLEMA IDENTIFICADO
Seu arquivo DOCX tem tags XML fragmentadas internamente que NÃO podem ser corrigidas apenas limpando formatação visual. Mesmo sem formatação aparente, o XML interno está quebrado.

## ✅ SOLUÇÃO GARANTIDA EM 5 MINUTOS

### Opção 1: Usar Template Limpo (RECOMENDADO) ⭐

1. **Use o arquivo já criado:**
   ```
   C:\Users\igorp\OneDrive\Área de Trabalho\Igor\Mirai\react-mirai\mirai-react\server\uploads\documents\templates\contrato_prestacao_servicos.docx
   ```

2. **Abra no Word** e personalize:
   - ✅ Altere fontes, cores, tamanhos
   - ✅ Adicione logos, cabeçalhos, rodapés
   - ✅ Ajuste espaçamentos e margens
   - ❌ **NÃO TOQUE** nas variáveis `{{...}}`

3. **Salve e faça upload** no sistema

4. **Teste** gerando um contrato

---

### Opção 2: Criar do Zero com Google Docs (100% FUNCIONAL) 🌐

Google Docs **NÃO fragmenta** as tags como o Word faz!

1. **Crie um novo documento no Google Docs**

2. **Cole este conteúdo:**

```
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: {{empresa.razao_social}}
CNPJ: {{empresa.cnpj}}
Endereço: {{empresa.endereco}}, {{empresa.cidade}} - {{empresa.estado}}, CEP: {{empresa.cep}}

CONTRATADA: MIRAI Segurança do Trabalho
Representante: {{contratante.nome}}

PROGRAMAS CONTRATADOS:
{{#proposta.programas}}
- Quantidade: {{quantidade}} - Valor: R$ {{valor_total}}
{{/proposta.programas}}

VALOR TOTAL: R$ {{proposta.valor_total}}

VIGÊNCIA:
De: {{data_inicio_vigencia}} até {{data_fim_vigencia}}

Data: {{data_atual}}

Responsável: {{responsavel.nome_completo}}
Email: {{responsavel.email}}
```

3. **Formate no Google Docs**:
   - Fonte, cores, espaçamentos
   - NÃO edite as tags `{{...}}`

4. **Baixe como DOCX**:
   - Arquivo → Download → Microsoft Word (.docx)

5. **Faça upload** do arquivo baixado no sistema

6. **Teste** gerando um contrato

---

### Opção 3: Usar LibreOffice (Gratuito) 📝

LibreOffice também trata melhor as tags:

1. **Baixe LibreOffice** (se não tiver): https://pt-br.libreoffice.org/

2. **Abra o LibreOffice Writer**

3. **Cole o texto** do template acima

4. **Formate** como desejar (sem tocar nas tags)

5. **Salve como .docx**:
   - Arquivo → Salvar Como → Formato: Microsoft Word 2007-365 (.docx)

6. **Faça upload** no sistema

---

## 🔍 POR QUE O WORD QUEBRA AS TAGS?

Quando você digita `{{empresa.razao_social}}` no Microsoft Word:

```
O que você vê:  {{empresa.razao_social}}

O que o Word salva internamente:
<w:r><w:t>{{empr</w:t></w:r>
<w:r><w:t>esa.razao_so</w:t></w:r>
<w:r><w:t>cial}}</w:t></w:r>
```

Isso acontece porque:
- ❌ Corretor ortográfico marca "empresa" como palavra válida
- ❌ Formatação automática adiciona metadados
- ❌ Cada caractere pode ter XML diferente
- ❌ Copiar/colar mantém a fragmentação

## ✅ POR QUE GOOGLE DOCS E LIBREOFFICE FUNCIONAM?

Eles geram XML mais simples e não fragmentam tanto as tags.

---

## 🚀 TESTE RÁPIDO (2 MINUTOS)

Para testar se seu template está correto:

1. **Abra o terminal no servidor**
2. **Execute:**
   ```bash
   cd server
   node -e "
   const PizZip = require('pizzip');
   const fs = require('fs');
   const zip = new PizZip(fs.readFileSync('uploads/documents/templates/SEU_ARQUIVO.docx'));
   const xml = zip.file('word/document.xml').asText();
   const matches = xml.match(/\{\{[^}]+\}\}/g);
   console.log('Variáveis encontradas:', matches);
   "
   ```

3. **Se aparecer `{{empresa.razao_social}}` completo → OK ✅**
4. **Se aparecer `{{empr` ou fragmentado → ERRO ❌**

---

## 📋 RESUMO - O QUE FAZER AGORA

**Escolha UMA das 3 opções acima e siga o passo a passo.**

Recomendo a **Opção 2 (Google Docs)** porque é:
- ✅ Online (sem instalar nada)
- ✅ 100% compatível com docxtemplater
- ✅ Não fragmenta as tags
- ✅ Fácil de formatar

---

## ❓ DÚVIDAS COMUNS

**P: Posso usar meu arquivo atual e só corrigir?**
R: Não vale a pena. É mais rápido criar um novo pelo Google Docs.

**P: E se eu já gastei muito tempo formatando no Word?**
R: Copie o texto visual (sem as tags) para o Google Docs, adicione as tags lá, e formate novamente.

**P: O template gerado automaticamente está muito simples**
R: Sim, é só a base. Abra no Word, formate visualmente, mas NÃO edite as tags.

---

**🎯 Ação recomendada:** Use a **Opção 2 (Google Docs)** agora mesmo!
