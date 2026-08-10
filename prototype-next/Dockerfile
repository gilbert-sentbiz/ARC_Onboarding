FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# Run dev server — static export config (output:'export') is ignored in dev mode
CMD ["npm", "run", "dev", "--", "--port", "3000", "--hostname", "0.0.0.0"]
