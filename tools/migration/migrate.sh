#!/bin/sh
export CERTDOMAIN=api-v3.boardgamecomponion.com
export NODE_ENV=production
export DB_HOSTNAME=bgc-db-instance.cdwqehzl1wpl.eu-west-1.rds.amazonaws.com
export DB_NAME=bgcomponion
export DB_USERNAME=dbadmin
export USE_SSL=true
export NODE_TLS_REJECT_UNAUTHORIZED=0
export DB_PASSWORD=$(aws --region eu-west-1 ssm get-parameter --name DB_PASSWORD --query 'Parameter.Value' --output text)
export JWT_SECRET_KEY=$(aws --region eu-west-1 ssm get-parameter --name JWT_SECRET_KEY --query 'Parameter.Value' --output text)
export SENDGRID_API_KEY=$(aws --region eu-west-1 ssm get-parameter --name SENDGRID_API_KEY --query 'Parameter.Value' --output text)

npx apidoc -i src/api/ -o -i src/doc/; sleep 5; . .env && npx sequelize db:migrate