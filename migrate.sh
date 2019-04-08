#!/bin/bash

export DB_HOSTNAME="ec2-54-217-235-16.eu-west-1.compute.amazonaws.com"
export DB_NAME="dd3pchju6plpv6"
export DB_PASSWORD="5ba16d513e0b7641b566e2dca539f65fddc9f8563d63e9cae0111f1982631726"
export DB_USERNAME="yirqxrwyciqeev"
export NODE_ENV="staging"
export PORT=8080
export JWT_SECRET_KEY="Kbqz%G^hoc37;T8G]]s)/Q8.t;NkCvcU+Lo)#E_=,q:.6"
export USE_SSL=true

./node_modules/apidoc/bin/apidoc -i api/ -o doc/
cd ./api && ../node_modules/.bin/sequelize db:migrate