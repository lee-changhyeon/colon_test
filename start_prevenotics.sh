#!/bin/bash


export PATH=$PATH:/home/pvmvp/.nvm/versions/node/v18.17.0/bin

# 현재 실행 중인 프로세스를 확인
current_process=$(pm2 list | grep -E "colon_collection" | grep online | awk '{print $4}')

# app.js가 실행 중이면 test.js로 전환, 반대면 app.js로 전환
if [[ "$current_process" = "colon_collection" ]]; then
  pm2 stop colon_collection
  pm2 start BACKEND
  pm2 start VENOTICS
else
  pm2 start BACKEND
  pm2 start VENOTICS
fi

current_datetime=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$current_datetime] Switching from colon_collection to BACKEND and VENOTICS" >> /home/pvmvp/Desktop/colon_test/colon_test/pm2_list.log
pm2 list >> /home/pvmvp/Desktop/colon_test/colon_test/pm2_list.log