#!/bin/bash
DB_PASSWORD=$(aws --region eu-west-1 ssm get-parameter --name DB_PASSWORD --query 'Parameter.Value' --output text)
JWT_SECRET_KEY=$(aws --region eu-west-1 ssm get-parameter --name JWT_SECRET_KEY --query 'Parameter.Value' --output text)
SENDGRID_API_KEY=$(aws --region eu-west-1 ssm get-parameter --name SENDGRID_API_KEY --query 'Parameter.Value' --output text)