#!/bin/bash

# any future command that fails will exit the script
set -e

# Lets write the public key of our aws instance
# eval $(ssh-agent -s)
# echo "$" | tr -d '\r' | ssh-add - > /dev/null
pwd
echo -e "$SSH_KEY" > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa

# disable the host key checking.
./disableHostKeyChecking.sh
