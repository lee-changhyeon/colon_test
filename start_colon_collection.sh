#!/bin/bash
echo "123123213"

export PATH=$PATH:/home/pvmvp/.nvm/versions/node/v18.17.0/bin

# 현재 실행 중인 프로세스를 확인
current_process=$(pm2 list | grep -E "BACKEND|VENOTICS" | grep online | awk '{print $4}')

# app.js가 실행 중이면 test.js로 전환, 반대면 app.js로 전환
if [[ "$current_process" = *"BACKEND"* || "$current_process" = *"VENOTICS"* ]]; then
  pm2 stop VENOTICS
  pm2 stop BACKEND
  pm2 start colon_collection
else
  pm2 start colon_collection
fi

current_datetime=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$current_datetime] Switching from BACKEND to colon_collection" >> /home/pvmvp/Desktop/colon_test/colon_test/pm2_list.log
pm2 list >> /home/pvmvp/Desktop/colon_test/colon_test/pm2_list.log