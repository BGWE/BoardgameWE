#!/bin/bash

# any future command that fails will exit the script
set -e

addSSHKey () {
    eval "$(ssh-agent -s)"
    chmod 600 /tmp/key.pem
    ssh-add /tmp/key.pem
}

# disable the host key checking.
bash ./tools/bgcinfra/configs/disableHostKeyChecking.sh

if [[ $TRAVIS_BRANCH == "develop" ]]; then
    echo "Deploy for branch 'develop'"

    openssl aes-256-cbc -K $encrypted_3f4d3615b6b0_key -iv $encrypted_3f4d3615b6b0_iv -in BGCDev.pem.enc -out /tmp/key.pem -d
    addSSHKey

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js development

elif [[ $TRAVIS_BRANCH == "master" ]]; then
    echo "Deploy for branch 'master'"

    openssl aes-256-cbc -K $encrypted_3f4d3615b6b0_key -iv $encrypted_3f4d3615b6b0_iv -in BGCProd.pem.enc -out /tmp/key.pem -d
    addSSHKey 

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js production
else
    echo "Current branch: '$TRAVIS_BRANCH', skipping deployment..."
fi