#!/bin/bash --login

if [ $# == 0 ];
then
    echo 'you need pass param!'
    exit
else
    pm2 $1 $2 $3 $4 $5 $6
fi;
