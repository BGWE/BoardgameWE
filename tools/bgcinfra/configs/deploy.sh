#!/bin/bash

# any future command that fails will exit the script
set -e

echo $TRAVIS_BRANCH

openssl aes-256-cbc -K $encrypted_3f4d3615b6b0_key -iv $encrypted_3f4d3615b6b0_iv -in BGCDev.pem.enc -out /tmp/BGCDev.pem -d
eval "$(ssh-agent -s)"
chmod 600 /tmp/BGCDev.pem
ssh-add /tmp/BGCDev.pem
echo -e "Host *\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config

# disable the host key checking.
bash ./tools/bgcinfra/configs/disableHostKeyChecking.sh

# Deploy
pm2 deploy ./tools/bgcinfra/configs/ecosystem.config.js development