.PHONY: all run dev check format fmt lint

HOME ?= ~

CACHE_DIR ?= $(HOME)/.cache/eclairbot
PKG_DIR ?= $(HOME)/.cache/deno/npm
CONFIG_FILE ?= bot/config.js
DATABASES ?= bot.db,bot.db-journal

DENO_IO_PERMS_FLAGS   = --allow-read=$(CONFIG_FILE),.env,$(DATABASES),$(CACHE_DIR),$(PKG_DIR),. \
						--allow-write=$(CONFIG_FILE),$(DATABASES),$(CACHE_DIR),$(PKG_DIR),.
DENO_PERMISSION_FLAGS = $(DENO_IO_PERMS_FLAGS) --allow-net --allow-sys --allow-ffi --allow-env 

DENO_FLAGS            = --no-prompt $(DENO_PERMISSION_FLAGS)

all: 
	@deno compile $(DENO_FLAGS) --output eclairbot src/main.ts

run: check lint 
	@deno run $(DENO_FLAGS) src/main.ts

dev: check lint
	@deno run $(DENO_FLAGS) --watch src/main.ts

check:
	@deno check src/main.ts
	@deno check src/cmd/**/*.ts

format:
	@deno fmt src/**/*

fmt: format

lint:
	@deno lint src/**/*
