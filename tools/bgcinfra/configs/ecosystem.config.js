module.exports = {
    apps : [{
        name: 'API',
        script: 'server.js',
        
        // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
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
        production : {
            user: 'ec2-user',
            host : 'api.boardgamecomponion.com',
            ref  : 'origin/prodinfra',
            repo : 'https://github.com/BGWE/BoardgameWE.git',
            path : '/home/ec2-user/BoardgameWE',
            'post-deploy' : 'source /home/ec2-user/BoardgameWE/source/tools/bgcinfra/configs/secret_env.sh && npm install && pm2 startOrRestart /home/ec2-user/BoardgameWE/source/tools/bgcinfra/configs/ecosystem.config.js --env production && sudo certbot certonly --debug --nginx --non-interactive --agree-tos --domains api.boardgamecomponion.com --email fabrice.servais@gmail.com'
        }
    }
};