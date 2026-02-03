<div align="center">
    <img width="619" height="522" alt="image" src="https://github.com/user-attachments/assets/df43cd40-4b5d-4a33-99ea-337f5e5d3886" />
</div>

# EclairBOT 

A Discord bot made for the EclairBakery with a little bit of humour.

Features:

- many well-done commands (excluding economy, cuz it'll be moved to a new bot)
- fully customizable look and feel through Translations API and cfg.customization
- easy-to-use custom Discord action system
- manageable configuration with loader and commands to apply new changes on the fly 
- db backups sent on the channel in case something goes wrong

## Run locally

Install dependencies using this command:

`npm install`

Then, start the bot using this command:

`npm start`

Or, using make, execute `make depinstall` to install dependencies and then `make dev` to start an instance.

## Run in a container

We recommend you to follow these steps.

1. Create Dockerfile or Containerfile that launches `start.hosting-only.js`. I personally use this on production.

```
FROM node:20-alpine

WORKDIR /home/gorciu/eclairbot

COPY package*.json ./

RUN npm install
RUN apk add --no-cache git

COPY . . 

RUN /usr/bin/git pull

CMD [ "node", "start.hosting-only.js" ]
```

2. Create a start.hosting-only.js file, which will automatically start the bot using the `npm start` command and restart it if there are any issues.

> [!TIP]
> Setup this file to automatically download new updates using `git`.

3. Start a container.

> [!CAUTION]
> It is recommended to not run this on very low-end hardware, because this command compiles the code on the server side.
> If you cannot deal with that, it is recommended to use `esbuild` to make a bundle and THEN launch a bundle on the server-side.
