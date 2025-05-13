FROM node:22.3-alpine AS build-step

WORKDIR /app/frontend
ENV PATH=/app/frontend/node_modules/.bin:$PATH
COPY package.json package-lock.json ./
RUN npm install --silent
COPY . ./
RUN npm run build

EXPOSE 8080

# Build step #2: build an nginx container
FROM nginx:stable-alpine
COPY --from=build-step /app/frontend/dist /usr/share/nginx/html
COPY ./conf/default.nginx /etc/nginx/conf.d/default.conf
# CMD [ "npm", "run",  "dev" ]
