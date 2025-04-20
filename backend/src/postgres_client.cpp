#include "postgres_client.h"
#include <iostream>

PostgresClient::PostgresClient() : conn(nullptr) {}

PostgresClient::~PostgresClient() {
    if (conn) PQfinish(conn);
}

bool PostgresClient::connect(const std::string& conninfo) {
    conn = PQconnectdb(conninfo.c_str());
    if (PQstatus(conn) != CONNECTION_OK) {
        std::cerr << "❌ PostgreSQL connection error: " << PQerrorMessage(conn) << std::endl;
        return false;
    }
    std::cout << "✅ Connected to PostgreSQL\n";
    return true;
}

void PostgresClient::createSchema() {
    const char* createTableQuery =
        "CREATE TABLE IF NOT EXISTS order_logs ("
        "id SERIAL PRIMARY KEY, "
        "order_id VARCHAR(50), "
        "user_id INTEGER, "
        "status VARCHAR(50), "
        "json_data JSONB, "
        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ");";

    PGresult* res = PQexec(conn, createTableQuery);
    if (PQresultStatus(res) != PGRES_COMMAND_OK) {
        std::cerr << "❌ Schema creation failed: " << PQerrorMessage(conn) << std::endl;
    }
    else {
        std::cout << "✅ PostgreSQL schema ready.\n";
    }
    PQclear(res);
}

void PostgresClient::logOrder(const nlohmann::json& orderData) {
    const char* paramValues[4];

    // ✅ Line 1: Safe fallback for order_id
    std::string orderIdStr = std::to_string(orderData.value("id", 0));

    // ✅ Line 2–5: Safe fallback for user_id
    std::string userIdStr = "0";
    if (orderData.contains("user_id") && orderData["user_id"].is_number_integer()) {
        userIdStr = std::to_string(orderData["user_id"].get<int>());
    }

    // ✅ Line 6: Safe fallback for status
    std::string status = orderData.value("status", "unknown");

    // ✅ Line 7: Full order dump
    std::string jsonStr = orderData.dump();

    // ✅ Line 8 (optional): Debug output
    //std::cout << "Inserting order: " << jsonStr << std::endl;

    // ✅ Line 9–12: Assign to PostgreSQL parameters
    paramValues[0] = orderIdStr.c_str();
    paramValues[1] = userIdStr.c_str();
    paramValues[2] = status.c_str();
    paramValues[3] = jsonStr.c_str();

    const char* query =
        "INSERT INTO order_logs (order_id, user_id, status, json_data) VALUES ($1, $2, $3, $4)";

    PGresult* res = PQexecParams(conn, query,
        4, nullptr, paramValues, nullptr, nullptr, 0);

    if (PQresultStatus(res) != PGRES_COMMAND_OK) {
        std::cerr << "Insert failed: " << PQerrorMessage(conn) << std::endl;
    }
    else {
        std::cout << "Order logged to PostgreSQL\n";
    }

    PQclear(res);
}


