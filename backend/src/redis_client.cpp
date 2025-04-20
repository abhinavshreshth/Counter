#include "redis_client.h"
#include <iostream>

RedisClient::RedisClient() : context(nullptr) {}

RedisClient::~RedisClient() {
    if (context) redisFree(context);
}

bool RedisClient::connect(const std::string& host, int port) {
    context = redisConnect(host.c_str(), port);
    if (!context || context->err) {
        std::cerr << "❌ Redis error: " << (context ? context->errstr : "Null context") << std::endl;
        return false;
    }
    std::cout << "✅ Connected to Redis\n";
    return true;
}

void RedisClient::pushMessage(const std::string& key, const std::string& message) {
    if (context) {
        redisCommand(context, "LPUSH %s %s", key.c_str(), message.c_str());
        redisCommand(context, "LTRIM %s 0 1000", key.c_str());
        std::cout << "Order sent to Redis\n";
    }
}
