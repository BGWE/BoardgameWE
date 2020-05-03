#!/bin/sh
. .env && npx apidoc -i src/api/ -o -i src/doc/; sleep 5; npx sequelize db:migrate