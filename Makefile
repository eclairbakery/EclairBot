.PHONY: all run dev check format fmt lint

HOME ?= ~

CACHE_DIR ?= $(HOME)/.cache/eclairbot
FONTS_DIR ?= $(HOME)/.cache/deno/npm/*/figlet/*/fonts
CONFIG_FILE ?= bot/config.js

DENO_IO_PERMS_FLAGS   = --allow-read=$(CONFIG_FILE),bot.db,.env,bot.db-journal,$(CACHE_DIR),$(FONTS_DIR) \
						--allow-write=$(CONFIG_FILE),bot.db,bot.db-journal,$(CACHE_DIR),$(FONTS_DIR)

DENO_PERMISSION_FLAGS = $(DENO_IO_PERMS_FLAGS) --allow-net --allow-sys=hostname,systemMemoryInfo --allow-env 
DENO_FLAGS            = --no-prompt $(DENO_PERMISSION_FLAGS)

all: run

run: check lint 
	@deno run $(DENO_FLAGS) src/main.ts

dev: check lint
	@deno run $(DENO_FLAGS) --watch src/main.ts

check:
	@deno check src/main.ts

format:
	@deno fmt src/**/*

fmt: format

lint:
	@deno lint src/**/*
