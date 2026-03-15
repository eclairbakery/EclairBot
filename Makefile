all: check run

# please note that -A is unsafe
# it was added here for easy and quick shipment
# and will have to be removed as quickly as possible
run: 
	@deno run -A src/main.ts

check:
	@deno check src/main.ts

format:
	@deno fmt src/**/*

fmt: format

lint:
	@deno lint src/**/*
