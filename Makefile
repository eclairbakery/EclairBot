all: jsbuild 

dev:
	npm run dev

depconfig:
	npm install
	npm audit
	npm audit fix

jsbuild:
	npx tsc
	npx tsc-alias
