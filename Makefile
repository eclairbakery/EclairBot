all: jsbuild 

dev:
	npm start

depconfig:
	npm install
	npm audit
	npm audit fix

jsbuild:
	npx tsc
	npx tsc-alias
