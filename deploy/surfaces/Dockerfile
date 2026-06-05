FROM node:22-alpine
WORKDIR /app
COPY tools/surfaces-server.mjs /app/tools/surfaces-server.mjs
COPY tools/bake-geo.mjs /app/tools/bake-geo.mjs
COPY yuri /app/yuri
# geo de CIDADE (DB-IP City Lite, CC-BY, IPv4): baixado + compilado no build pra
# dentro da imagem (NÃO commitado, fora do git/build-context — ~31MB). Non-fatal:
# se o dataset falhar, a surface cai pra geo de país (binários commitados). v6 city
# (~98MB gz) fica de fora — IPv6 resolve em nível de país.
RUN node --max-old-space-size=2048 tools/bake-geo.mjs --city || echo "[geo] city build skipped"
ENV PORT=8080
EXPOSE 8080
CMD ["node", "tools/surfaces-server.mjs"]
