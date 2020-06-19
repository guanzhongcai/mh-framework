#!/usr/bin/env bash

echo "请输入命令：dev/pro"
read cmd

if [ ${cmd} = "dev" ]; then
	echo "password: mSn7pCXAFPQ#GAef"
    ssh root@47.100.205.134  # mSn7pCXAFPQ#GAef
elif [ ${cmd} = "pro" ]; then
	echo "password: OgH&!7N25cXkVfYp"
    ssh root@139.224.16.218 # OgH&!7N25cXkVfYp
else
	echo "输入错误。BYE"
fi;
