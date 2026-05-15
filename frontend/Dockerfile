FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential python3 git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install --legacy-peer-deps --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
