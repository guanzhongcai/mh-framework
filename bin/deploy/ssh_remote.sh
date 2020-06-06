#!/usr/bin/env bash
#对远程主机逐个执行本地shell脚本
hosts=(
"47.100.205.134"
)
port=22

hostNum=${#hosts[*]}

for ((i=0;i<hostNum;i++)) do
  host=${hosts[i]}
  echo "执行主机${i}：${host}"
  ssh root@${host} -p ${port} 'bash -s' < exec_script.sh
done
