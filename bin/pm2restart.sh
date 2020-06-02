#!/usr/bin/env bash
#!/bin/bash

if [ $# = 0 ];
then
  pm2 list
        echo "\n\033[33m 请输入pm2守护的进程ID或进程名称：\033[0m"
        read id
else
        id=$1
fi;

pm2 restart ${id} && pm2 logs ${id}
