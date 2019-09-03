#!/bin/bash

# any future command that fails will exit the script
set -e

if [[ $TRAVIS_BRANCH == "develop" ]]; then
    echo "Deploy for branch 'develop'"
    openssl aes-256-cbc -K $encrypted_3f4d3615b6b0_key -iv $encrypted_3f4d3615b6b0_iv -in BGCDev.pem.enc -out /tmp/BGCDev.pem -d
    eval "$(ssh-agent -s)"
    chmod 600 /tmp/BGCDev.pem
    ssh-add /tmp/BGCDev.pem

    # disable the host key checking.
    bash ./tools/bgcinfra/configs/disableHostKeyChecking.sh

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js development
else
    echo "Current branch: '$TRAVIS_BRANCH', skipping deployment..."
fi