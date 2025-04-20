#pragma once
#include <string>
#include <zmq.hpp>

class ZmqSender {
public:
    ZmqSender(const std::string& address = "tcp://localhost:5555");
    void send(const std::string& message);
private:
    zmq::context_t context;
    zmq::socket_t socket;
};
