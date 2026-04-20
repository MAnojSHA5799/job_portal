# Use official Playwright image which has all browsers and dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port (same as your Express server)
EXPOSE 4000

# Start the server
CMD [ "node", "index.js" ]
