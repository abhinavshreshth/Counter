#include "logger.h"
#include <iostream>
#include <fstream>

Logger::Logger(const std::string& filename) : filename(filename) {
    std::ofstream out(filename, std::ios::app);
    if (out.is_open()) {
        out << "[INFO] Logger initialized\n";
        out.close();
    }
}

void Logger::logError(const std::string& message) {
    std::ofstream out(filename, std::ios::app);
    if (out.is_open()) {
        out << "[ERROR] " << message << "\n";
        out.close();
    }
    else {
        std::cerr << "[ERROR] Failed to write to log file\n";
    }
}
