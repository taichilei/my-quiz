#!/bin/bash

# 启动 MongoDB 的 Docker 命令
echo "Starting MongoDB with Docker..."

docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo

echo "MongoDB started. Connection string: mongodb://admin:password@localhost:27017"
