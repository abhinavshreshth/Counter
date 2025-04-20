#include "order_simulator.h"
#include <cstdlib>
#include <ctime>
#include <thread>
#include <chrono>
#include <vector>
#include <nlohmann/json.hpp>
#include <iostream>


using json = nlohmann::json;

namespace {
    // Helper to pick a random element
    template<typename T>
    T getRandomElement(const std::vector<T>& vec) {
        return vec[rand() % vec.size()];
    }

    // Helper to pick a random sleep duration
    int getRandomSleepDuration(int minMs, int maxMs) {
        return minMs + rand() % (maxMs - minMs + 1);
    }
}

// Seed the RNG once in constructor
OrderSimulator::OrderSimulator(ZmqSender& zmq_, RedisClient& redis_, PostgresClient& pg_, Logger& logger_)
    : zmq(zmq_), redis(redis_), pg(pg_), logger(logger_) {
    srand(static_cast<unsigned>(time(nullptr)));
}

void OrderSimulator::start() {
    // Simulation parameters
    std::vector<std::string> symbols    = {"TCS", "INFY", "HDFC", "RELIANCE", "SBIN"};
    std::vector<std::string> orderTypes = {"limit", "market"};
    std::vector<std::string> statuses   = {"pending", "filled", "filled",
                                           "pending", "filled", "pending",
                                           "filled", "cancelled", "rejected"};
    std::vector<std::string> sides      = {"buy", "sell"};
    std::vector<std::string> users      = {"user_101", "user_102", "user_103", "user_104"};

    for (int i = 1; i <= 1000; ++i) {
        // Randomize order fields
        std::string symbol    = getRandomElement(symbols);
        std::string side      = getRandomElement(sides);
        std::string orderType = getRandomElement(orderTypes);
        std::string status    = getRandomElement(statuses);
        std::string userId    = getRandomElement(users);

        int quantity = rand() % 100 + 1;
        double price = 2000.0 + (rand() % 1000) + (rand() % 100) / 100.0;
        int filledQty    = (status == "filled" ? quantity : rand() % quantity);
        int remainingQty = quantity - filledQty;

        // Build JSON payload
        json data = {
            {"id", i},
            {"timestamp", static_cast<long>(time(nullptr))},
            {"user_id", userId},
            {"type", "order"},
            {"order_type", orderType},
            {"status", status},
            {"exchange", "NSE"},
            {"payload", {
                {"symbol", symbol},
                {"side", side},
                {"price", price},
                {"quantity", quantity},
                {"filled_quantity", filledQty},
                {"remaining_quantity", remainingQty}
            }}
        };

        std::string msg = data.dump();

        // Route out to ZMQ, Redis, Postgres and log locally
        std::cout << "Sent simulated order JSON: " << msg << std::endl;
        zmq.send(msg);
        redis.pushMessage("messageQueue", msg);
        pg.logOrder(data);

        //logger.log("Simulated order: " + msg);

        // Random pause between messages
        std::this_thread::sleep_for(
            std::chrono::milliseconds(getRandomSleepDuration(700, 3000))
        );
    }
}
