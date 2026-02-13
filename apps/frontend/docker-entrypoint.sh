#!/bin/sh
set -eu

: "${API_URL:=http://localhost:3000}"
: "${FRONTEND_URL:=http://localhost:4200}"
: "${GITHUB_CLIENT_ID:=}"
: "${GOOGLE_CLIENT_ID:=}"
: "${GA_MEASUREMENT_ID:=}"

envsubst '${API_URL} ${FRONTEND_URL} ${GITHUB_CLIENT_ID} ${GOOGLE_CLIENT_ID} ${GA_MEASUREMENT_ID}' \
  < /usr/share/nginx/html/env.template.js \
  > /usr/share/nginx/html/env.js
