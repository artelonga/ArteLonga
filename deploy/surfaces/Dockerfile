FROM node:22-alpine
WORKDIR /app
COPY tools/surfaces-server.mjs /app/tools/surfaces-server.mjs
COPY yuri /app/yuri
ENV PORT=8080
EXPOSE 8080
CMD ["node", "tools/surfaces-server.mjs"]
