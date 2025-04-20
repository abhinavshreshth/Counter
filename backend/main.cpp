#include "order_simulator.h"
#include "zmq_sender.h"
#include "redis_client.h"
#include "postgres_client.h"
#include "logger.h"

int main() {
    srand(static_cast<unsigned int>(time(0)));

    ZmqSender zmq;
    RedisClient redis;
    PostgresClient pg;
    Logger logger("makemytrade.log");

    if (!redis.connect()) {
        logger.logError("Failed to connect to Redis");
        return -1;
    }

    if (!pg.connect()) {
        logger.logError("Failed to connect to PostgreSQL");
        return -1;
    }
    //pg.createSchema();

    OrderSimulator simulator(zmq, redis, pg, logger);
    simulator.start();

    return 0;
}
