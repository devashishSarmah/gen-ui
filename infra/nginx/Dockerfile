FROM nginx:alpine

RUN apk add --no-cache openssl

COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/docker-entrypoint.sh /docker-entrypoint.d/10-generate-cert.sh
RUN chmod +x /docker-entrypoint.d/10-generate-cert.sh
