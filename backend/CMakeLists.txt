cmake_minimum_required(VERSION 3.10)
project(MakeMyTradeCpp VERSION 1.0 LANGUAGES CXX)

# ──────────────────────────────────────────────────────────────────────────────
# 1) C++ Standard
# ──────────────────────────────────────────────────────────────────────────────
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ──────────────────────────────────────────────────────────────────────────────
# 2) Dependencies (vcpkg integrated via -DCMAKE_TOOLCHAIN_FILE)
# ──────────────────────────────────────────────────────────────────────────────
find_package(Threads     REQUIRED)
find_package(CURL        REQUIRED)
find_package(OpenSSL     REQUIRED)
find_package(ZLIB        REQUIRED)
find_package(cppzmq      REQUIRED)
find_package(hiredis     CONFIG REQUIRED)
find_package(PostgreSQL  REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED) 

# ──────────────────────────────────────────────────────────────────────────────
# 3) Boost (random only)
# ──────────────────────────────────────────────────────────────────────────────
set(Boost_USE_STATIC_LIBS    OFF)
set(Boost_USE_MULTITHREADED   ON)
find_package(Boost REQUIRED COMPONENTS random)

# ──────────────────────────────────────────────────────────────────────────────
# 4) Collect source files
# ──────────────────────────────────────────────────────────────────────────────
file(GLOB ROOT_SRC "${CMAKE_CURRENT_SOURCE_DIR}/main.cpp")
file(GLOB SRC_FILES "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp")
file(GLOB HEADER_FILES "${CMAKE_CURRENT_SOURCE_DIR}/include/*.h" "${CMAKE_CURRENT_SOURCE_DIR}/include/*.hpp")

add_executable(makemytrade ${ROOT_SRC} ${SRC_FILES} ${HEADER_FILES})


# ──────────────────────────────────────────────────────────────────────────────
# 5) Include paths
# ──────────────────────────────────────────────────────────────────────────────
target_include_directories(makemytrade PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${PostgreSQL_INCLUDE_DIRS}
  ${Boost_INCLUDE_DIRS}
)

# ──────────────────────────────────────────────────────────────────────────────
# 6) Link libraries (fixed cppzmq target)
# ──────────────────────────────────────────────────────────────────────────────
target_link_libraries(makemytrade PRIVATE
  CURL::libcurl
  OpenSSL::SSL
  OpenSSL::Crypto
  ZLIB::ZLIB
  cppzmq              # ← corrected target name
  hiredis::hiredis
  Boost::random
  ${PostgreSQL_LIBRARIES}
  Threads::Threads
  nlohmann_json::nlohmann_json
)

# ──────────────────────────────────────────────────────────────────────────────
# 7) MSVC-specific compile flags
# ──────────────────────────────────────────────────────────────────────────────
if(MSVC)
  target_compile_options(makemytrade PRIVATE /Zi /W4 /WX)
  set_target_properties(makemytrade PROPERTIES LINK_FLAGS "/DEBUG")
endif()

# ──────────────────────────────────────────────────────────────────────────────
# 8) Install executable
# ──────────────────────────────────────────────────────────────────────────────
install(TARGETS makemytrade RUNTIME DESTINATION bin)
