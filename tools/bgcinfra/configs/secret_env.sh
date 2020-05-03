#!/bin/bash
export NODE_ENV=production
export DB_HOSTNAME=bgc-db-instance.cbzmmlktqvhn.eu-west-1.rds.amazonaws.com
export DB_NAME=bgcomponion
export DB_USERNAME=dbadmin
export USE_SSL=true
export DB_PASSWORD=$(aws --region eu-west-1 ssm get-parameter --name DB_PASSWORD --query 'Parameter.Value' --output text)
export JWT_SECRET_KEY=$(aws --region eu-west-1 ssm get-parameter --name JWT_SECRET_KEY --query 'Parameter.Value' --output text)
export SENDGRID_API_KEY=$(aws --region eu-west-1 ssm get-parameter --name SENDGRID_API_KEY --query 'Parameter.Value' --output text)