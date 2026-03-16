HOME ?= ~

DENO_IO_PERMS_FLAGS   = --allow-read=bot/config.js,bot.db,.env,bot.db-journal,$(HOME)/.cache/eclairbot --allow-write=bot/config.js,bot.db,bot.db-journal,$(HOME)/.cache/eclairbot
DENO_PERMISSION_FLAGS = $(DENO_IO_PERMS_FLAGS) --allow-net --allow-sys=hostname,systemMemoryInfo --allow-env 
DENO_FLAGS            = --no-prompt $(DENO_PERMISSION_FLAGS)

all: check lint run

run: 
	@deno run $(DENO_FLAGS) src/main.ts

check:
	@deno check src/main.ts

format:
	@deno fmt src/**/*

fmt: format

lint:
	@deno lint src/**/*
