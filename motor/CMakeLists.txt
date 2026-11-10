# Núcleo de reglas de Marca de Granito (5e, SRD 5.2.1) independiente de Unreal.
#
# Nativo (biblioteca, pruebas y herramienta de línea de órdenes):
#   cmake -S motor -B motor/build && cmake --build motor/build -j && ./motor/build/mdg_tests
# WebAssembly (sustituto de publicado/rules/rules.mjs + rules.wasm):
#   emcmake cmake -S motor -B motor/build-wasm && cmake --build motor/build-wasm -j
#   (deja motor/dist/rules.mjs y motor/dist/rules.wasm)
cmake_minimum_required(VERSION 3.16)
project(MarcaDeGranitoMotor CXX)

if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
  set(CMAKE_BUILD_TYPE Release)
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(MDG_DATA_DIR ${CMAKE_CURRENT_SOURCE_DIR}/data)
set(MDG_DIST_DIR ${CMAKE_CURRENT_SOURCE_DIR}/dist)

file(GLOB MDG_RULES_SOURCES CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/src/rules/*.cpp)
file(GLOB MDG_WEB_SOURCES CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/src/web/*.cpp)

if(EMSCRIPTEN)
  # Mismo modo que el publicado: -O2 sin NDEBUG (las aserciones de nlohmann siguen activas) y
  # excepciones nativas de WebAssembly.
  set(CMAKE_CXX_FLAGS_RELEASE "-O2")
  add_compile_options(-fwasm-exceptions)
  add_link_options(-fwasm-exceptions)
endif()

add_library(mdg_core STATIC ${MDG_RULES_SOURCES} ${MDG_WEB_SOURCES})
target_include_directories(mdg_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src/rules ${CMAKE_CURRENT_SOURCE_DIR}/src/web)
target_include_directories(mdg_core SYSTEM PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/third_party)
if(NOT MSVC)
  target_compile_options(mdg_core PRIVATE -Wall -Wextra -Wno-sign-conversion)
  if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU" AND CMAKE_CXX_COMPILER_VERSION VERSION_GREATER_EQUAL 13)
    target_compile_options(mdg_core PRIVATE -Wno-dangling-reference)
  endif()
else()
  add_compile_options(/utf-8 /bigobj)
endif()

if(EMSCRIPTEN)
  # rules.mjs + rules.wasm con la misma interfaz que el publicado: createRules({locateFile}),
  # _mdg_call/_malloc/_free, UTF8ToString/stringToNewUTF8 y los datos embebidos en /data.
  add_executable(rules ${CMAKE_CURRENT_SOURCE_DIR}/src/main_wasm.cpp)
  target_link_libraries(rules PRIVATE mdg_core)
  set_target_properties(rules PROPERTIES SUFFIX ".mjs" RUNTIME_OUTPUT_DIRECTORY ${MDG_DIST_DIR})
  target_link_options(rules PRIVATE
    -sENVIRONMENT=web,node
    -sMODULARIZE=1
    -sEXPORT_ES6=1
    -sEXPORT_NAME=createRules
    -sEXPORTED_FUNCTIONS=_mdg_call,_malloc,_free
    -sEXPORTED_RUNTIME_METHODS=UTF8ToString,stringToNewUTF8
    -sALLOW_MEMORY_GROWTH=1
    --embed-file ${MDG_DATA_DIR}@/data)
else()
  enable_testing()
  file(GLOB MDG_TEST_SOURCES CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/tests/test_*.cpp)
  add_executable(mdg_tests ${MDG_TEST_SOURCES})
  target_link_libraries(mdg_tests PRIVATE mdg_core)
  target_include_directories(mdg_tests PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/third_party/doctest)
  target_compile_definitions(mdg_tests PRIVATE MDG_DATA_DIR="${MDG_DATA_DIR}")
  add_test(NAME mdg_tests COMMAND mdg_tests)

  # Herramienta de línea de órdenes: una petición JSON por línea en la entrada, una respuesta por línea.
  add_executable(mdg_cli ${CMAKE_CURRENT_SOURCE_DIR}/src/main_cli.cpp)
  target_link_libraries(mdg_cli PRIVATE mdg_core)
  target_compile_definitions(mdg_cli PRIVATE MDG_DATA_DIR="${MDG_DATA_DIR}")
endif()
