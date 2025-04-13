cmake_minimum_required(VERSION 3.10)

project(Counter VERSION 1.0 LANGUAGES CXX)

# Use C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include headers
include_directories("${PROJECT_SOURCE_DIR}/include")
include_directories("D:/visualStudio/headers")

# Find external libraries
find_package(CURL REQUIRED)
find_package(OpenSSL REQUIRED)
find_package(ZLIB REQUIRED)
find_package(cppzmq REQUIRED)
find_package(hiredis CONFIG REQUIRED)

# Choose Boost stacktrace backend depending on platform
if(WIN32)
    find_package(Boost REQUIRED COMPONENTS random stacktrace_windbg)
else()
    find_package(Boost REQUIRED COMPONENTS random stacktrace_backtrace)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -rdynamic")  # For Linux: needed by stacktrace
endif()

# Include Boost headers
include_directories(${Boost_INCLUDE_DIRS})

# Gather your source files
file(GLOB SRC_FILES
    "${PROJECT_SOURCE_DIR}/src/*.cpp"
    "${PROJECT_SOURCE_DIR}/include/*.h"
    "${PROJECT_SOURCE_DIR}/main.cpp"
)

# Create the executable
add_executable(Counter ${SRC_FILES})

# Windows: Add debug symbols (for .pdb & stacktrace)
if(MSVC)
    target_compile_options(Counter PRIVATE /Zi)
    set_target_properties(Counter PROPERTIES LINK_FLAGS "/DEBUG")
endif()

# Link external libraries
target_link_libraries(Counter
    CURL::libcurl            # For making HTTP requests
    OpenSSL::SSL             # For SSL/TLS
    OpenSSL::Crypto          # For cryptographic functions
    ZLIB::ZLIB               # For compression
    ${Boost_LIBRARIES}       # For Boost random + stacktrace backend
    cppzmq                   # For ZeroMQ C++ bindings
    hiredis::hiredis    
)

# (Optional) Install rule
install(TARGETS Counter RUNTIME DESTINATION bin)
