#include "logger.h"
#include <fstream>
#include <ctime>

Logger::Logger(const std::string& filename_) : filename(filename_) {}

void Logger::logError(const std::string& message) {
    std::ofstream logFile(filename, std::ios::app);
    std::time_t now = std::time(nullptr);
    logFile << "[" << std::ctime(&now) << "]: " << message << std::endl;
}
