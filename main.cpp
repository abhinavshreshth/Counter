#include <zmq.hpp>
#include <iostream>
#include <string>
#include <hiredis/hiredis.h>
#include <thread>
#include <chrono>
#include <nlohmann/json.hpp>
#include <vector>
#include <cstdlib>
#include <ctime>

using json = nlohmann::json;
using namespace std;

// Random selection helper
template<typename T>
T getRandomElement(const vector<T>& vec) {
    return vec[rand() % vec.size()];
}

int getRandomSleepDuration(int minMs, int maxMs) {
    return minMs + rand() % (maxMs - minMs + 1);
}

int main() {
    srand(time(0));  // Seed random

    zmq::context_t context(1);
    zmq::socket_t socket(context, ZMQ_PUSH);
    socket.connect("tcp://localhost:5555");

    redisContext* redis = redisConnect("127.0.0.1", 6379);
    if (redis->err) {
        cerr << "Redis connection failed: " << redis->errstr << endl;
        return -1;
    }


    vector<string> symbols = { "TCS", "INFY", "HDFC", "RELIANCE", "SBIN" };
    vector<string> orderTypes = { "limit", "market" };
    vector<string> statuses = {
    "pending", "filled", "filled",
    "pending", "filled", "pending",
    "filled", "cancelled", "rejected"
    };
    vector<string> sides = { "buy", "sell" };
    vector<string> users = { "user_101", "user_102", "user_103", "user_104" };

    for (int i = 1; i <= 1000; ++i) {
        string symbol = getRandomElement(symbols);
        string side = getRandomElement(sides);
        string orderType = getRandomElement(orderTypes);
        string status = getRandomElement(statuses);
        string userId = getRandomElement(users);

        int quantity = rand() % 100 + 1;  // 1 to 100
        double price = 2000.0 + (rand() % 1000) + (rand() % 100) / 100.0;

        int filledQty = (status == "filled") ? quantity : rand() % quantity;
        int remainingQty = quantity - filledQty;

        json data = {
            {"id", i},
            {"timestamp", time(nullptr)},
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

        string jsonStr = data.dump();

        redisCommand(redis, "LPUSH messageQueue %s", jsonStr.c_str());
        socket.send(zmq::buffer(jsonStr), zmq::send_flags::none);

        cout << "Sent simulated order JSON: " << jsonStr << endl;
        // Random sleep between 2000ms and 7000ms
        int sleepMs = getRandomSleepDuration(300, 3000);
        this_thread::sleep_for(chrono::milliseconds(sleepMs));
    }

    redisFree(redis);
    return 0;
}
