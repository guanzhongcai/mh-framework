#!/usr/bin/env bash

echo "请输入命令：dev/pro"
read cmd

if [ ${cmd} = "dev" ]; then
    ssh root@47.100.205.134  # mSn7pCXAFPQ#GAef
elif [ ${cmd} = "pro" ]; then
    ssh root@139.224.16.218 # OgH&!7N25cXkVfYp
else
	echo "输入错误。BYE"
fi;
