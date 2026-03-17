.PHONY: all run dev check format fmt lint

HOME ?= ~

CACHE_DIR ?= $(HOME)/.cache/eclairbot
CONFIG_FILE ?= bot/config.js

DENO_IO_PERMS_FLAGS   = --allow-read=$(CONFIG_FILE),bot.db,.env,bot.db-journal,$(CACHE_DIR) \
						--allow-write=$(CONFIG_FILE),bot.db,bot.db-journal,$(CACHE_DIR)

DENO_PERMISSION_FLAGS = $(DENO_IO_PERMS_FLAGS) --allow-net --allow-sys=hostname,systemMemoryInfo --allow-env 
DENO_FLAGS            = --no-prompt $(DENO_PERMISSION_FLAGS)

all: check lint run

run: 
	@deno run $(DENO_FLAGS) src/main.ts

dev:
	@deno run $(DENO_FLAGS) --watch src/main.ts

check:
	@deno check src/main.ts

format:
	@deno fmt src/**/*

fmt: format

lint:
	@deno lint src/**/*
