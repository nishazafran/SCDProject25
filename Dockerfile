# Use official Node.js LTS image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend source files
COPY . .

# Expose the backend port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
