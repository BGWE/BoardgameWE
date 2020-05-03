const { execSync } = require('child_process');
module.exports = {
    apps: [{
        name: 'API',
        script: 'npm',
        args: 'run envstart',

        // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development',
            DB_HOSTNAME: 'ec2-46-137-188-105.eu-west-1.compute.amazonaws.com',
            DB_NAME: 'd283kb5i1s2nda',
            DB_USERNAME: 'negjhbtiwkpkiv',
            USE_SSL: 'true',
            NODE_TLS_REJECT_UNAUTHORIZED: '0'
        },
        env_production: {
            NODE_ENV: 'production',
            DB_HOSTNAME: 'bgc-db-instance.cbzmmlktqvhn.eu-west-1.rds.amazonaws.com',
            DB_NAME: 'bgcomponion',
            DB_USERNAME: 'dbadmin',
            USE_SSL: 'true',
            NODE_TLS_REJECT_UNAUTHORIZED: '0'
        }
    }],

    deploy: {
        development: {
            user: 'ec2-user',
            key: '~/.ssh/BGCDev.pem',
            host: 'api-dev.boardgamecomponion.com',
            ref: 'origin/develop',
            repo: 'https://github.com/BGWE/BoardgameWE.git',
            path: '/home/ec2-user/BoardgameWE',
            'post-deploy': "\
                export CERTDOMAIN=api-dev.boardgamecomponion.com && \
                npm install && \
                cp /home/ec2-user/BoardgameWE/source/tools/bgcinfra/configs/develop_env.sh /home/ec2-user/BoardgameWE/source/.env && \
                cp /home/ec2-user/BoardgameWE/current/tools/bgcinfra/configs/develop_env.sh /home/ec2-user/BoardgameWE/current/.env && \
                bash /home/ec2-user/BoardgameWE/source/tools/migration/migrate.sh && \
                pm2 start npm -- run envstart && \
                sudo certbot certonly --debug --nginx --non-interactive --agree-tos --domains ${CERTDOMAIN} --email fabrice.servais@gmail.com && \
                sudo ln -sf /etc/letsencrypt/live/${CERTDOMAIN} /etc/letsencrypt/live/bgccert && \
                sudo bash /home/ec2-user/BoardgameWE/source/tools/scripts/deploy_https_nginx.sh"
        },
        production: {
            user: 'ec2-user',
            key: '~/.ssh/BGCProd.pem',
            host: 'api-v3.boardgamecomponion.com',
            ref: 'master',
            repo: 'https://github.com/BGWE/BoardgameWE.git',
            path: '/home/ec2-user/BoardgameWE',
            'post-deploy': '\
            export CERTDOMAIN=api-v3.boardgamecomponion.com && \
                npm install && \
                cp /home/ec2-user/BoardgameWE/source/tools/bgcinfra/configs/secret_env.sh /home/ec2-user/BoardgameWE/source/.env && \
                source /home/ec2-user/BoardgameWE/source/.env; npx sequelize db:migrate; \
                pm2 start npm -- run envstart && \
                sudo certbot certonly --debug --nginx --non-interactive --agree-tos --domains ${CERTDOMAIN} --email fabrice.servais@gmail.com && \
                sudo ln -sf /etc/letsencrypt/live/${CERTDOMAIN} /etc/letsencrypt/live/bgccert && \
                sudo cp /tmp/https.conf /etc/nginx/conf.d/https.conf && \
                sudo nginx -s reload'
        }
    }
};