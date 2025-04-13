cmake_minimum_required(VERSION 3.10)

project(HFTSystem VERSION 1.0 LANGUAGES CXX)

# Use C++17 for modern features.
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)


# Tell the compiler where to find headers in "include/"
include_directories("${PROJECT_SOURCE_DIR}/include")
include_directories("D:/visualStudio/headers")

# Find external libraries (OpenSSL, cURL)
find_package(CURL REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)
find_package(Boost REQUIRED COMPONENTS random)

# Gather your source files (including main.cpp)
file(GLOB SRC_FILES
    "${PROJECT_SOURCE_DIR}/src/*.cpp"
    "${PROJECT_SOURCE_DIR}/include/*.h"
    "${PROJECT_SOURCE_DIR}/main.cpp"
)

# Create the executable
add_executable(HFTSystem ${SRC_FILES})

# Link external libraries
target_link_libraries(HFTSystem
    CURL::libcurl
    OpenSSL::SSL
    OpenSSL::Crypto
    ZLIB::ZLIB
    ${Boost_LIBRARIES}
)

# (Optional) Installation rule
install(TARGETS HFTSystem RUNTIME DESTINATION bin)
