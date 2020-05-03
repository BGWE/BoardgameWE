#!/bin/bash
export NODE_ENV=development
export DB_HOSTNAME=ec2-46-137-188-105.eu-west-1.compute.amazonaws.com
export DB_NAME=d283kb5i1s2nda
export DB_USERNAME=negjhbtiwkpkiv
export USE_SSL=true
export NODE_TLS_REJECT_UNAUTHORIZED=0
export DB_PASSWORD=$(aws --region eu-west-1 ssm get-parameter --name DB_PASSWORD_DEV --query 'Parameter.Value' --output text)
export JWT_SECRET_KEY=$(aws --region eu-west-1 ssm get-parameter --name JWT_SECRET_KEY --query 'Parameter.Value' --output text)
export SENDGRID_API_KEY=$(aws --region eu-west-1 ssm get-parameter --name SENDGRID_API_KEY --query 'Parameter.Value' --output text)
