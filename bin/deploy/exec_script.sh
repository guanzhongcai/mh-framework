#!/usr/bin/env bash
#更新远程程序代码&重启服务

services=(
"game-1"
"game-2"
"game-3"
"game-4"
)
workDir=/usr/local/micro-server
pm2=/usr/local/micro-server/bin/pm2-cmd.sh

cd ${workDir}
git pull
git log -1

serviceNum=${#services[*]}
for ((i=0;i<serviceNum;i++)) do
  service=${services[i]}
  echo "重启服务$((i+1))：${service}"
#  bash -i ${pm2} restart ${service}
  bash -i ${pm2} info ${service}
done

