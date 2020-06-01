#!/usr/bin/env python3
#coding=utf-8

import redis
cli = redis.Redis(host='localhost', port=12000, password='mhpass123456')

GameServerStatus = {
    '1': { 'platform': 1, 'channel': 1, 'status': 0 },
    '2': { 'platform': 2, 'channel': 1, 'status': 0 },
    '3': { 'platform': 3, 'channel': 1, 'status': 0 }
}

if __name__ == '__main__':
    for k in GameServerStatus:
        cli.hmset('GameServerStatus:' + k, GameServerStatus[k])