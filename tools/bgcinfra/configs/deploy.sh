#!/bin/bash

# any future command that fails will exit the script
set -e

addSSHKey () {
    echo "openssl aes-256-cbc -K $encrypted_3f4d3615b6b0_key -iv $encrypted_3f4d3615b6b0_iv -in $1 -out /tmp/key.pem -d"
    openssl aes-256-cbc -K $encrypted_3f4d3615b6b0_key -iv $encrypted_3f4d3615b6b0_iv -in "$1" -out /tmp/key.pem -d
    eval "$(ssh-agent -s)"
    chmod 600 /tmp/key.pem
    ssh-add /tmp/key.pem
}

# disable the host key checking.
bash ./tools/bgcinfra/configs/disableHostKeyChecking.sh

if [[ $TRAVIS_BRANCH == "develop" ]]; then
    echo "Deploy for branch 'develop'"

    addSSHKey "BGCDev.pem.enc"

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js development

elif [[ $TRAVIS_BRANCH == "master" ]]; then
    echo "Deploy for branch 'master'"

    addSSHKey "BGCProd.pem.enc"

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js production
else
    echo "Current branch: '$TRAVIS_BRANCH', skipping deployment..."
fi