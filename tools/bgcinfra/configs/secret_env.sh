#!/bin/bash
CERTDOMAIN=api-v3.boardgamecomponion.com
NODE_ENV=production
DB_HOSTNAME=bgc-db-instance.cbzmmlktqvhn.eu-west-1.rds.amazonaws.com
DB_NAME=bgcomponion
DB_USERNAME=dbadmin
USE_SSL=true
NODE_TLS_REJECT_UNAUTHORIZED=0
DB_PASSWORD=$(aws --region eu-west-1 ssm get-parameter --name DB_PASSWORD --query 'Parameter.Value' --output text)
JWT_SECRET_KEY=$(aws --region eu-west-1 ssm get-parameter --name JWT_SECRET_KEY --query 'Parameter.Value' --output text)
SENDGRID_API_KEY=$(aws --region eu-west-1 ssm get-parameter --name SENDGRID_API_KEY --query 'Parameter.Value' --output text)