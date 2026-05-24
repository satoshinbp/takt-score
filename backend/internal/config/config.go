package config

import (
	"strings"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	DatabaseURL string   `env:"DATABASE_URL" envDefault:"postgres://taktscore:taktscore@localhost:5432/taktscore"`
	CORSOrigins []string `env:"CORS_ORIGINS" envDefault:"http://localhost:3000"`
	HTTPAddr    string   `env:"HTTP_ADDR" envDefault:":8000"`
}

// Load reads env vars into Config. CORS_ORIGINS accepts a comma-separated list
// (e.g. "http://localhost:3000,https://app.example.com").
func Load() (*Config, error) {
	var c Config
	if err := env.Parse(&c); err != nil {
		return nil, err
	}
	cleaned := make([]string, 0, len(c.CORSOrigins))
	for _, o := range c.CORSOrigins {
		o = strings.TrimSpace(o)
		if o != "" {
			cleaned = append(cleaned, o)
		}
	}
	c.CORSOrigins = cleaned
	return &c, nil
}
