#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
test_binary_dir=$(mktemp -d)
trap 'rm -rf "$test_binary_dir"' EXIT
for test_source in tests/native/quick_capture_titlebar_test.m tests/native/quick_capture_title_test.m; do
  test_name=$(basename "$test_source" .m)
  clang -fobjc-arc -framework AppKit "$test_source" src-tauri/native/QuickCaptureDocument.m -o "$test_binary_dir/$test_name"
  "$test_binary_dir/$test_name"
done
