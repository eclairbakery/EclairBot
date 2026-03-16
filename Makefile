HOME ?= ~

all: check lint run

run: 
	@deno run --no-prompt --allow-read=bot/config.js,bot.db,.env,bot.db-journal,$(HOME)/.cache/eclairbot --allow-write=bot/config.js,bot.db,bot.db-journal,$(HOME)/.cache/eclairbot --allow-net --allow-sys=hostname,systemMemoryInfo --allow-env src/main.ts src/main.ts

check:
	@deno check src/main.ts

format:
	@deno fmt src/**/*

fmt: format

lint:
	@deno lint src/**/*
