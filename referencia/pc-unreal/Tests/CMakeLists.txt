# Pruebas del núcleo de reglas, fuera de Unreal: cmake -S Tests -B build && cmake --build build && ./build/mdg_tests
cmake_minimum_required(VERSION 3.16)
project(MarcaDeGranitoRules CXX)

if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
  set(CMAKE_BUILD_TYPE Release)
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(MSVC)
  # Los textos en español van en UTF-8 (Unreal compila igual: /source-charset y /execution-charset utf-8)
  add_compile_options(/utf-8 /bigobj)
endif()

set(RULES_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../Source/MarcaDeGranitoPC/Rules)
set(THIRD_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../Source/MarcaDeGranitoPC/ThirdParty)
set(DATA_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../Content/Data)

file(GLOB RULES_SOURCES ${RULES_DIR}/*.cpp)
add_library(mdg_rules STATIC ${RULES_SOURCES})
target_include_directories(mdg_rules PUBLIC ${RULES_DIR})
target_include_directories(mdg_rules SYSTEM PUBLIC ${THIRD_DIR} ${CMAKE_CURRENT_SOURCE_DIR}/third_party)

if(MSVC)
  # Sin /WX: la comprobación estricta de avisos (-Werror) se hace con GCC y Clang
  target_compile_options(mdg_rules PRIVATE /W4 /permissive-)
else()
  # -Wshadow: Unreal trata el sombreado de variables como error
  target_compile_options(mdg_rules PRIVATE -Wall -Wextra -Wshadow -Wconversion -Wno-sign-conversion -Werror)
  if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU" AND CMAKE_CXX_COMPILER_VERSION VERSION_GREATER_EQUAL 13)
    # Falsos positivos de GCC 13 con funciones que devuelven una referencia a su primer argumento
    target_compile_options(mdg_rules PRIVATE -Wno-dangling-reference)
  endif()
endif()

file(GLOB TEST_SOURCES ${CMAKE_CURRENT_SOURCE_DIR}/test_*.cpp)
add_executable(mdg_tests ${TEST_SOURCES})
target_link_libraries(mdg_tests PRIVATE mdg_rules)
target_compile_definitions(mdg_tests PRIVATE MDG_DATA_DIR="${DATA_DIR}")

add_executable(mdg_dump ${CMAKE_CURRENT_SOURCE_DIR}/tools/dump_main.cpp)
target_link_libraries(mdg_dump PRIVATE mdg_rules)
target_compile_definitions(mdg_dump PRIVATE MDG_DATA_DIR="${DATA_DIR}")

add_executable(mdg_battle_dump ${CMAKE_CURRENT_SOURCE_DIR}/tools/battle_dump_main.cpp)
target_link_libraries(mdg_battle_dump PRIVATE mdg_rules)
target_compile_definitions(mdg_battle_dump PRIVATE MDG_DATA_DIR="${DATA_DIR}")
