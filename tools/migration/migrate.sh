#!/bin/sh
. .env
cat .env
echo $DB_HOSTNAME
npx apidoc -i src/api/ -o -i src/doc/; sleep 5; npx sequelize db:migrate