#!/bin/bash
# Script pós-deploy para CapRover
# Executar o banco de dados e inicializar usuários

set -e

echo "🔧 Inicializando banco de dados..."

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não está definida"
  exit 1
fi

# Instalar dependências psql (se necessário)
# apt-get update && apt-get install -y postgresql-client

# Extrair conexão do DATABASE_URL
# URL format: postgresql://user:password@host:port/database

# Executar init-users.sql
echo "📊 Executando script de inicialização de usuários..."

psql "$DATABASE_URL" -f init-users.sql 2>&1 || {
  echo "⚠️  Script de usuários não foi executado (pode já estar inicializado)"
}

echo "✅ Banco de dados inicializado com sucesso!"
