FROM node:20-alpine
WORKDIR /app

# Copy package files and install all dependencies (including prisma for migrations)
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source
COPY . .

# Generate Prisma client
RUN npx prisma generate || true

# Expose port
EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
