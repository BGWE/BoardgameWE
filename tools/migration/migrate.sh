#!/bin/sh
npx apidoc -i src/api/ -o -i src/doc/; sleep 5; . .env && npx sequelize db:migrate