/**
 * Script para criar template DOCX com tags corretas
 * Uso: node server/scripts/create-template.js
 */

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Conteúdo do template
const templateContent = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: {{empresa.razao_social}}
Nome Fantasia: {{empresa.nome_fantasia}}
CNPJ: {{empresa.cnpj}}
Endereço: {{empresa.endereco}}, {{empresa.cidade}} - {{empresa.estado}}, CEP: {{empresa.cep}}

CONTRATADA: MIRAI Segurança do Trabalho
Representada por: {{contratante.nome}}
CPF: {{contratante.cpf}}
Cargo: {{contratante.cargo}}

─────────────────────────────────────────

DO OBJETO

O presente contrato tem por objeto a prestação de serviços de assessoria e consultoria em Segurança do Trabalho, conforme Proposta Comercial nº {{proposta.id}}.

─────────────────────────────────────────

DOS PROGRAMAS CONTRATADOS

{{#proposta.programas}}
→ Programa: Programa de Prevenção
  Quantidade: {{quantidade}}
  Valor Unitário: R$ {{valor_unitario}}
  Subtotal: R$ {{valor_total}}
{{/proposta.programas}}

VALOR TOTAL DO CONTRATO: R$ {{proposta.valor_total}}

─────────────────────────────────────────

DA VIGÊNCIA

Data de Início: {{data_inicio_vigencia}}
Data de Término: {{data_fim_vigencia}}

O prazo de vigência deste contrato é de 12 (doze) meses, podendo ser renovado mediante acordo entre as partes.

─────────────────────────────────────────

DAS OBRIGAÇÕES DA CONTRATADA

A CONTRATADA se obriga a:
- Prestar os serviços de forma profissional e ética
- Cumprir os prazos estabelecidos
- Manter sigilo sobre informações da empresa

─────────────────────────────────────────

DAS OBRIGAÇÕES DA CONTRATANTE

A CONTRATANTE se obriga a:
- Efetuar o pagamento nas datas acordadas
- Fornecer as informações necessárias para execução dos serviços
- Permitir acesso às instalações quando necessário

─────────────────────────────────────────

DO PAGAMENTO

Os valores serão pagos mensalmente, conforme cronograma estabelecido na proposta comercial.

─────────────────────────────────────────

OBSERVAÇÕES

{{proposta.observacoes}}

─────────────────────────────────────────

E por estarem assim justos e contratados, assinam o presente instrumento em 02 (duas) vias de igual teor e forma.

Data: {{data_atual}}

_____________________________          _____________________________
CONTRATANTE                            CONTRATADA
{{empresa.razao_social}}               MIRAI Segurança do Trabalho

Responsável: {{responsavel.nome_completo}}
CPF: {{responsavel.cpf}}
E-mail: {{responsavel.email}}
`;

// Criar um DOCX simples
function createSimpleDocx(content) {
  // Template mínimo de um documento DOCX
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${content.split('\n').map(line => `
    <w:p>
      <w:r>
        <w:t xml:space="preserve">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t>
      </w:r>
    </w:p>`).join('')}
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const zip = new PizZip();
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', documentXml);

  return zip.generate({ type: 'nodebuffer' });
}

// Gerar o arquivo
const outputPath = path.join(__dirname, '../uploads/documents/templates/contrato_prestacao_servicos.docx');
const outputDir = path.dirname(outputPath);

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const buffer = createSimpleDocx(templateContent);
fs.writeFileSync(outputPath, buffer);

console.log('✅ Template criado com sucesso!');
console.log('📁 Arquivo:', outputPath);
console.log('');
console.log('Próximos passos:');
console.log('1. Abra o arquivo no Word');
console.log('2. Ajuste a formatação (fontes, espaçamentos, etc)');
console.log('3. NÃO edite as variáveis {{...}} - apenas o texto ao redor');
console.log('4. Faça upload deste arquivo no sistema');
