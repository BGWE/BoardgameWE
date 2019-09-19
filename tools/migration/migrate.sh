#!/bin/sh

./node_modules/apidoc/bin/apidoc -i api/ -o doc/ && sleep 15 && cd ./api && ../node_modules/.bin/sequelize db:migrate