SHELL := /bin/bash

DB_URL ?= postgres://taktscore:taktscore@localhost:5432/taktscore?sslmode=disable

.PHONY: run build test tidy fmt sqlc migrate-up migrate-down migrate-status seed

run:
	set -a; [ -f .env ] && . ./.env; set +a; go run ./cmd/server

build:
	go build -o bin/server ./cmd/server
	go build -o bin/seed ./cmd/seed

test:
	go test ./...

tidy:
	go mod tidy

fmt:
	go fmt ./...

sqlc:
	sqlc generate

migrate-up:
	goose -dir migrations postgres "$(DB_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DB_URL)" down

migrate-status:
	goose -dir migrations postgres "$(DB_URL)" status

seed:
	go run ./cmd/seed
