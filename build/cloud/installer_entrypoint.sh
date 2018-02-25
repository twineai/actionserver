#!/bin/bash -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT_NAME=$(basename "${BASH_SOURCE[0]}")

echoerr() {
  >&2 echo "$@"
}

if [[ -z "${BUCKET_NAME}" ]]; then
  echoerr "Missing bucket name"
  exit 1
fi

if [[ -z "${ACTION_DIR}" ]]; then
  echoerr "Missing action path"
  exit 1
fi

echo "Installing actions"
echo "====="
/usr/local/bin/install_actions.sh "${BUCKET_NAME}" "${ACTION_DIR}" $@
