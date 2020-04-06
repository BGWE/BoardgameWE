FROM node:13.12.0

WORKDIR /home/node/app

COPY package.json /home/node/app

RUN yarn install
# RUN apt-get update && apt-get install -y dos2unix vim

COPY ./src /home/node/app/src
COPY ./tools/migration /home/node/app/tools/migration
COPY ./test /home/node/app/test
COPY ./.sequelizerc /home/node/app/
COPY ./.eslintrc.json /home/node/app/

RUN npx apidoc -i src/api/ -o src/doc/

CMD ["sh", "-c", "npx sequelize db:migrate && if [ \"$NODE_ENV\" = \"development\" ]; then npx sequelize db:seed:all; fi && yarn start"]