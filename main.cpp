
#include <zmq.hpp>
#include <iostream>
#include <string>
#include <hiredis/hiredis.h>  // Redis C++ client
#include <thread>
#include <chrono>
using namespace std;

int main() {
    zmq::context_t context(1);
    zmq::socket_t socket(context, ZMQ_PUSH);
    socket.connect("tcp://localhost:5555");

    redisContext* redis = redisConnect("127.0.0.1", 6379);
    if (redis->err) {
        cerr << "Redis connection failed: " << redis->errstr << endl;
        return -1;
    }

    for (int i = 1; i <= 1000; ++i) {
        string msg = to_string(i);
        redisCommand(redis, "LPUSH messageQueue %s", msg.c_str());
        socket.send(zmq::buffer(msg), zmq::send_flags::none);
        cout << "Sent number: " << msg << endl;
        this_thread::sleep_for(chrono::seconds(1));
    }

    redisFree(redis);
    return 0;
}
