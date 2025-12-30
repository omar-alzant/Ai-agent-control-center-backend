FROM node:20-slim

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install --legacy-depth-apear

# Copy the rest of the code
COPY . .

# Expose the port Railway uses
EXPOSE 4000

# Use tsx to run the server just like in development
CMD ["npx", "tsx", "server.ts"]