all:
	npm run build

depconfig:
	npm install
	npm audit
	npm audit fix

dev:
	npm start

jsbuild:
	npx tsc
	npx tsc-alias