#!/bin/sh
if [[ -f "/tmp/https.conf" ]]; then
    sudo cp /tmp/https.conf /etc/nginx/conf.d/https.conf && sudo nginx -s reload
fi
