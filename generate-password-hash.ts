#!/usr/bin/env node

/**
 * Script para gerar hash de senha seguro
 * 
 * Uso:
 *   npm run generate-password-hash "sua_senha_aqui"
 *   
 * Exemplo:
 *   npm run generate-password-hash "MinhaSenh@123"
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('❌ Erro: Forneça uma senha como argumento');
  console.log('Uso: npm run generate-password-hash "sua_senha"');
  process.exit(1);
}

// Validações
if (password.length < 8) {
  console.error('❌ Erro: Senha deve ter no mínimo 8 caracteres');
  process.exit(1);
}

async function generateHash() {
  try {
    console.log('🔄 Gerando hash da senha (pode levar alguns segundos)...\n');
    const hash = await bcrypt.hash(password, 10);
    
    console.log('✅ Hash gerado com sucesso!\n');
    console.log('📋 Hash (copie para usar no SQL):');
    console.log(`   ${hash}\n`);
    
    console.log('📝 Exemplo de INSERT SQL:');
    console.log(`   INSERT INTO system_users (username, email, password_hash, role, status)`);
    console.log(`   VALUES ('seu_usuario', 'seu_email@empresa.com', '${hash}', 'user', 'ativo');\n`);
    
    console.log('✨ Pronto! Use o hash acima no seu SQL.');
  } catch (error) {
    console.error('❌ Erro ao gerar hash:', error);
    process.exit(1);
  }
}

generateHash();
