FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (necessário para o build do Vite)
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação Vite
RUN npm run build

# Expor porta
EXPOSE 3000

# Criar diretórios necessários
RUN mkdir -p /app/uploads/atestados && \
    mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get(\"http://localhost:\" + port, (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar servidor
CMD ["npm", "run", "start"]
