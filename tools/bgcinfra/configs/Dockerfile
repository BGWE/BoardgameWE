FROM node:8
COPY . /home/node/app
WORKDIR /home/node/app

RUN apt-get update && apt-get install dos2unix && dos2unix /home/node/app/tools/migration/migrate.sh
RUN yarn install ; chmod +x /home/node/app/tools/migration/migrate.sh
CMD ["sh", "-c", "/home/node/app/tools/migration/migrate.sh && yarn start"]