#pragma once
#include <string>
#include <hiredis/hiredis.h>

class RedisClient {
public:
    RedisClient();
    ~RedisClient();
    bool connect(const std::string& host = "127.0.0.1", int port = 6379);
    void pushMessage(const std::string& key, const std::string& message);
private:
    redisContext* context;
};
