#pragma once
#include <string>

class Logger {
public:
    Logger(const std::string& filename);
    void logError(const std::string& message);
private:
    std::string filename;
};
