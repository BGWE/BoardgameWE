#!/bin/bash
NODE_ENV=development
DB_HOSTNAME=ec2-46-137-188-105.eu-west-1.compute.amazonaws.com
DB_NAME=d283kb5i1s2nda
DB_USERNAME=negjhbtiwkpkiv
USE_SSL=true
DB_PASSWORD=$(aws --region eu-west-1 ssm get-parameter --name DB_PASSWORD_DEV --query 'Parameter.Value' --output text)
JWT_SECRET_KEY=$(aws --region eu-west-1 ssm get-parameter --name JWT_SECRET_KEY --query 'Parameter.Value' --output text)
SENDGRID_API_KEY=$(aws --region eu-west-1 ssm get-parameter --name SENDGRID_API_KEY --query 'Parameter.Value' --output text)
