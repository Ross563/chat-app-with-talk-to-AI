# Use Node.js base image
FROM node:23-slim

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port your backend runs on
EXPOSE 8080

# Define the environment variables
ENV NODE_ENV=deployment

# Start the backend server
CMD ["node", "index.js"]
