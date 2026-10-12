FROM node:22-alpine
RUN addgroup -S worker && adduser -S worker -G worker
WORKDIR /app
COPY . /app/workers/
USER worker