#!/bin/bash

# any future command that fails will exit the script
set -e

addSSHKey () {
    echo "$1"
    echo "$2"
    echo "$3"
    openssl aes-256-cbc -K $1 -iv $2 -in $3 -out /tmp/key.pem -d
    eval "$(ssh-agent -s)"
    chmod 600 /tmp/key.pem
    ssh-add /tmp/key.pem
}

if [[ $TRAVIS_BRANCH == "develop" ]]; then
    echo "Deploy for branch 'develop'"
    addSSHKey $encrypted_3f4d3615b6b0_key $encrypted_3f4d3615b6b0_iv "BGCDev.pem.enc"

    # disable the host key checking.
    bash ./tools/bgcinfra/configs/disableHostKeyChecking.sh

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js development

elif [[ $TRAVIS_BRANCH == "master" ]]; then
    echo "Deploy for branch 'develop'"
    openssl aes-256-cbc -K $encrypted_3f4d3615b6b0_key -iv $encrypted_3f4d3615b6b0_iv -in BGCProd.pem.enc -out /tmp/BGCDev.pem -d
    eval "$(ssh-agent -s)"
    chmod 600 /tmp/BGCDev.pem
    ssh-add /tmp/BGCDev.pem

    # disable the host key checking.
    bash ./tools/bgcinfra/configs/disableHostKeyChecking.sh

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js production
else
    echo "Current branch: '$TRAVIS_BRANCH', skipping deployment..."
fi