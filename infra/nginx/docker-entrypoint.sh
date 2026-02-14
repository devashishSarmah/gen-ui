#!/bin/sh
set -eu

CERT_DIR="/etc/nginx/certs"
CERT_FILE="${CERT_DIR}/fullchain.pem"
KEY_FILE="${CERT_DIR}/privkey.pem"

: "${NGINX_CERT_DOMAIN:=localhost}"
: "${NGINX_CERT_DAYS:=365}"

mkdir -p "${CERT_DIR}"

if [ ! -s "${CERT_FILE}" ] || [ ! -s "${KEY_FILE}" ]; then
  echo "No TLS cert found. Generating self-signed cert for ${NGINX_CERT_DOMAIN}."
  openssl req \
    -x509 \
    -nodes \
    -newkey rsa:2048 \
    -days "${NGINX_CERT_DAYS}" \
    -subj "/CN=${NGINX_CERT_DOMAIN}" \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}"
fi
