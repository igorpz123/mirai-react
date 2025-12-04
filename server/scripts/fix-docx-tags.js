/**
 * Script para corrigir tags quebradas em arquivos DOCX
 * Uso: node server/scripts/fix-docx-tags.js <caminho-do-arquivo.docx>
 */

const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

function fixDocxTags(inputPath, outputPath) {
  console.log('🔧 Corrigindo tags do arquivo DOCX...\n');

  // Ler arquivo
  const content = fs.readFileSync(inputPath);
  const zip = new PizZip(content);

  // Extrair document.xml
  const documentXml = zip.file('word/document.xml').asText();
  
  console.log('📄 Analisando document.xml...');
  console.log(`   Tamanho original: ${documentXml.length} bytes\n`);

  // Função para limpar tags XML e manter apenas o texto
  function cleanXmlKeepText(xml) {
    // Remove quebras de XML dentro das tags {{...}}
    let fixed = xml;
    
    // Padrão para encontrar fragmentos de tags como: <w:r><w:t>{{empr</w:t></w:r><w:r><w:t>esa.nome}}</w:t></w:r>
    // e transformar em: <w:r><w:t>{{empresa.nome}}</w:t></w:r>
    
    // 1. Remover todas as tags XML temporariamente para ver o texto puro
    const textOnly = xml.replace(/<[^>]+>/g, '');
    
    // 2. Encontrar todas as variáveis no texto
    const variables = textOnly.match(/\{\{[^}]+\}\}/g) || [];
    console.log(`✓ Encontradas ${variables.length} variáveis no texto\n`);
    
    variables.forEach(v => {
      console.log(`   - ${v}`);
    });
    
    // 3. Para cada variável, encontrar onde ela está fragmentada no XML e juntar
    variables.forEach(variable => {
      // Escapar caracteres especiais para regex
      const escaped = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Criar regex que captura a variável mesmo com tags XML no meio
      // Exemplo: {{empr</w:t></w:r><w:r><w:t>esa.nome}}
      const parts = variable.split('');
      const pattern = parts.map(char => {
        if (char === '{' || char === '}') {
          return '\\' + char;
        }
        return char;
      }).join('(?:<[^>]*>)*'); // Permite tags XML entre cada caractere
      
      const regex = new RegExp(pattern, 'g');
      
      // Substituir pela versão limpa
      fixed = fixed.replace(regex, (match) => {
        // Extrair apenas as tags de abertura e fechamento do primeiro <w:r>
        const firstRun = match.match(/^(<w:r[^>]*>(?:<[^>]*>)*<w:t[^>]*>)/);
        const lastClose = match.match(/(<\/w:t><\/w:r>)$/);
        
        if (firstRun && lastClose) {
          return firstRun[1] + variable + lastClose[1];
        }
        return match;
      });
    });
    
    return fixed;
  }

  console.log('\n🔨 Aplicando correções...\n');
  const fixedXml = cleanXmlKeepText(documentXml);
  
  // Verificar se houve mudanças
  if (fixedXml === documentXml) {
    console.log('⚠️  Nenhuma correção foi necessária ou possível');
    console.log('   O arquivo pode estar muito corrompido.\n');
    console.log('💡 Sugestão: Use o template gerado pelo script create-template.js\n');
    return false;
  }
  
  console.log(`✓ XML corrigido (${fixedXml.length} bytes)\n`);
  
  // Atualizar o ZIP
  zip.file('word/document.xml', fixedXml);
  
  // Salvar arquivo corrigido
  const buffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, buffer);
  
  console.log('✅ Arquivo corrigido salvo em:', outputPath);
  console.log('\nPróximos passos:');
  console.log('1. Faça upload deste arquivo corrigido no sistema');
  console.log('2. Tente gerar o contrato novamente\n');
  
  return true;
}

// Processar argumentos
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('❌ Erro: Nenhum arquivo especificado\n');
  console.log('Uso: node fix-docx-tags.js <caminho-do-arquivo.docx>\n');
  console.log('Exemplo:');
  console.log('  node fix-docx-tags.js "../uploads/documents/templates/1733233861741_contrato_prestacao_servicos_docx.docx"\n');
  process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = inputPath.replace('.docx', '_CORRIGIDO.docx');

if (!fs.existsSync(inputPath)) {
  console.log('❌ Erro: Arquivo não encontrado:', inputPath, '\n');
  process.exit(1);
}

try {
  fixDocxTags(inputPath, outputPath);
} catch (error) {
  console.error('❌ Erro ao processar arquivo:', error.message);
  console.log('\n💡 Recomendação: Use o template gerado automaticamente');
  console.log('   Comando: node scripts/create-template.js\n');
  process.exit(1);
}
