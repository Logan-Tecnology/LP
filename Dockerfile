# Imagem oficial leve do Node.js Alpine
FROM node:20-alpine

# Cria diretório de trabalho
WORKDIR /app

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3055

# Copia arquivos do projeto
COPY package.json ./
COPY server.js ./
COPY public/ ./public/

# Cria pasta para armazenamento de leads
RUN mkdir -p /app/data && chown -R node:node /app

# Executa com usuário não-root por segurança
USER node

# Expõe porta configurada
EXPOSE 3055

# Healthcheck interno do container
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3055/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
