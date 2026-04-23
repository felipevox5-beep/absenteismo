FROM node:20-alpine

ENV NODE_ENV=production

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


# Iniciar servidor
CMD ["npm", "run", "start"]
