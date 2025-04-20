#pragma once
#include "zmq_sender.h"
#include "redis_client.h"
#include "postgres_client.h"
#include "logger.h"
#include <nlohmann/json.hpp>

class OrderSimulator {
public:
    OrderSimulator(ZmqSender&, RedisClient&, PostgresClient&, Logger&);
    void start();

private:
    ZmqSender& zmq;
    RedisClient& redis;
    PostgresClient& pg;
    Logger& logger;
};
