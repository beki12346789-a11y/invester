package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL   string
	JWTSecret     string
	Port          string
	AdminPhone    string
	AdminPassword string
	AdminName     string
}

func Load() *Config {
	// Try to load .env file, but don't fail if it doesn't exist
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/investment_platform?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "default-secret-change-in-production"),
		Port:          getEnv("PORT", "8080"),
		AdminPhone:    getEnv("ADMIN_PHONE", "0912345678"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
		AdminName:     getEnv("ADMIN_NAME", "System Administrator"),
	}

	if cfg.JWTSecret == "default-secret-change-in-production" {
		log.Println("WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!")
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
