FROM node:8

RUN apt-get update && apt-get install dos2unix
COPY . /home/node/app
WORKDIR /home/node/app
RUN dos2unix /home/node/app/tools/migration/migrate.sh
RUN yarn install ; chmod +x /home/node/app/tools/migration/migrate.sh
CMD ["sh", "-c", "/home/node/app/tools/migration/migrate.sh && cd api && ../node_modules/.bin/sequelize db:seed:all && cd .. && yarn start"]