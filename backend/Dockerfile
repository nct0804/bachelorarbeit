# Use the official Node.js image
FROM node:20

# Install netcat for the wait-for-it script
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Set working directory in container
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Add a check to verify DATABASE_URL before running commands
CMD sh -c "echo \"Using database: $(echo $DATABASE_URL | sed 's/.*@.*\///' | sed 's/?.*$//')\" && \
           npx prisma generate && \
           npx prisma migrate deploy && \
           npx prisma db seed && \
           npm run dev"

# Expose the port your app runs on
EXPOSE 3000

