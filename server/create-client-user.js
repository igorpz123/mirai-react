// Script para criar usuário cliente no portal
// Uso: node create-client-user.js

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n=== Criar Usuário do Portal do Cliente ===\n');

  const email = await question('E-mail do cliente: ');
  const password = await question('Senha: ');
  const nome = await question('Nome completo: ');
  const telefone = await question('Telefone (opcional): ');
  const empresaId = await question('ID da empresa: ');

  console.log('\nGerando hash da senha...');
  const hash = await bcrypt.hash(password, 10);

  console.log('\n=== SQL para executar no banco ===\n');
  console.log(`INSERT INTO client_users (empresa_id, email, password_hash, nome, telefone)`);
  console.log(`VALUES (`);
  console.log(`  ${empresaId},`);
  console.log(`  '${email}',`);
  console.log(`  '${hash}',`);
  console.log(`  '${nome}',`);
  console.log(`  ${telefone ? `'${telefone}'` : 'NULL'}`);
  console.log(`);\n`);

  console.log('Copie e cole o SQL acima no seu cliente MySQL.\n');

  rl.close();
}

main().catch((err) => {
  console.error('Erro:', err);
  rl.close();
  process.exit(1);
});
