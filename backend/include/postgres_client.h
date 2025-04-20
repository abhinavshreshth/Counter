#pragma once
#include <libpq-fe.h>
#include <string>
#include <nlohmann/json.hpp>

class PostgresClient {
public:
    PostgresClient();
    ~PostgresClient();
    bool connect(const std::string& conninfo = "host=localhost port=5432 dbname=makemytrade user=postgres password=123babu");

    void logOrder(const nlohmann::json& orderData);
    void createSchema();
private:
    PGconn* conn;
};
