FROM node:20-alpine
WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application source
COPY . .

# Expose port
EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
