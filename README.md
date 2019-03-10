# BoardgameWE

##

## Environment variables

In `production`, environment variables should be set before launching the server. In other node environments, env
variables which are undefined will be read from the `.env` file.

- NODE_ENV: determine the environment, among {'production', ...}.
- JWT_SECRET_KEY: json web token secret key
- JWT_DURATION: expiration time for tokens (4 days by default)
- DB_USERNAME: database user name
- DB_PASSWORD: database password
- DB_NAME: database name
- DB_HOSTNAME: database hostname
- PORT: node sever port
- TIMEZONE: default
- USE_SSL: whether or not the api should communicate with the database with SSL