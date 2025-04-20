#include "zmq_sender.h"
#include <iostream>

ZmqSender::ZmqSender(const std::string& address)
    : context(1), socket(context, ZMQ_PUSH)
{
    socket.connect(address);
    std::cout << "✅ Connected to ZeroMQ at " << address << std::endl;
}

void ZmqSender::send(const std::string& message) {
    socket.send(zmq::buffer(message), zmq::send_flags::none);
    std::cout << "Message sent via ZeroMQ\n";
}
