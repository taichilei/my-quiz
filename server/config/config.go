package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	MongoURI string
	DBName   string
}

func Load() *Config {
	// 优先从环境变量读取 MongoDB 连接字符串
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		// 默认使用本地 MongoDB
		mongoURI = "mongodb://localhost:27017"
	}
	
	// 优先从环境变量读取数据库名称
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "my-quiz"
	}
	
	return &Config{
		MongoURI: mongoURI,
		DBName:   dbName,
	}
}

func (c *Config) Connect() (*mongo.Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(c.MongoURI))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// 检查连接
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	log.Println("Connected to MongoDB")
	return client.Database(c.DBName), nil
}
