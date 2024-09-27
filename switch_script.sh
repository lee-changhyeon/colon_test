#!/bin/bash

export PATH=$PATH:/usr/local/nvm/versions/node/v18.17.0/bin

# 현재 실행 중인 프로세스를 확인
current_process=$(pm2 list | grep -E "app|colon_collection" | grep online | awk '{print $4}')
echo "${current_process}"
# app.js가 실행 중이면 test.js로 전환, 반대면 app.js로 전환
if [ "$current_process" = "app" ]; then
  echo "[$current_datetime] Switching from app.js to colon_collection.js" >> /workspace/colon_test/pm2_list.log
  pm2 stop app
  pm2 start colon_collection
elif [ "$current_process" = "colon_collection" ]; then
  echo "[$current_datetime] Switching from colon_collection.js to app.js" >> /workspace/colon_test/pm2_list.log
  pm2 stop colon_collection
  pm2 start app
else
  echo "[$current_datetime]  No app or colon_collection is running. Starting app.js" >> /workspace/colon_test/pm2_list.log
  pm2 start app
fi

pm2 list >> /workspace/colon_test/pm2_list.log