# Development stage
FROM node:24-alpine as build

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema to generate the client
COPY prisma ./prisma/
RUN npx prisma generate


# Copy source code
COPY src ./src/
COPY tsconfig.json ./


# Build the TypeScript code
RUN npm run build

# ---- Stage 2: Production ----
# Use a slim Node.js image for the final container
FROM node:24-alpine AS production

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy the built application and generated Prisma client from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./dist/generated



# Expose the application port
EXPOSE 3000

# The command to start the application
CMD ["npm", "run", "start"]