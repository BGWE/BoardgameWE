const { execSync } = require('child_process');
module.exports = {
    apps : [{
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
        },
        env_production: {
            NODE_ENV: 'production',
            DB_HOSTNAME: 'bgc-db-instance.cbzmmlktqvhn.eu-west-1.rds.amazonaws.com',
            DB_NAME: 'bgcomponion',
            DB_USERNAME: 'dbadmin',
            USE_SSL: 'true'
        }
    }],
    
    deploy : {
        development: {
            user: 'ec2-user',
            host : 'api-dev.boardgamecomponion.com',
            ref  : 'origin/develop',
            repo : 'https://github.com/BGWE/BoardgameWE.git',
            path : '/home/ec2-user/BoardgameWE',
            'post-deploy' : '\
                npm install && \
                cp /home/ec2-user/BoardgameWE/source/tools/bgcinfra/configs/develop_env.sh /home/ec2-user/BoardgameWE/source/.env && \
                pm2 start npm -- run envstart && \
                sudo certbot certonly --debug --nginx --non-interactive --agree-tos --domains api-dev.boardgamecomponion.com --email fabrice.servais@gmail.com && \
                sudo cp /tmp/https.conf /etc/nginx/conf.d/https.conf && \
                sudo nginx -s reload'
        },
        production : {
            user: 'ec2-user',
            host : 'apiredirect.boardgamecomponion.com',
            ref  : 'origin/releases/v3.0',
            repo : 'https://github.com/BGWE/BoardgameWE.git',
            path : '/home/ec2-user/BoardgameWE',
            'post-deploy' : '\
                npm install && \
                cp /home/ec2-user/BoardgameWE/source/tools/bgcinfra/configs/secret_env.sh /home/ec2-user/BoardgameWE/source/.env && \
                pm2 start npm -- run envstart && \
                sudo certbot certonly --debug --nginx --non-interactive --agree-tos --domains apiredirect.boardgamecomponion.com --email fabrice.servais@gmail.com && \
                sudo cp /tmp/https.conf /etc/nginx/conf.d/https.conf && \
                sudo nginx -s reload'
        }
    }
};