#!/bin/bash

# any future command that fails will exit the script
set -e

# Usage:
# addSSHKey <path to private key>
addSSHKey () {
    eval "$(ssh-agent -s)"
    chmod 600 $1
    ssh-add $1
}

# disable the host key checking.
bash ./tools/bgcinfra/configs/disableHostKeyChecking.sh

if [[ $TRAVIS_BRANCH == "develop" ]]; then
    echo "Deploy for branch 'develop'"

    addSSHKey ./BGCDev.pem

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js development setup
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js development

elif [[ $TRAVIS_BRANCH == "master" ]]; then
    echo "Deploy for branch 'master'"

    addSSHKey ./BGCProd.pem

    # Deploy
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js production setup
    pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js production
else
    echo "Current branch: '$TRAVIS_BRANCH', skipping deployment..."
fi