# Dockerfile
FROM node:18

WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

EXPOSE 3000

# Run the server
CMD ["node", "server.js"]
