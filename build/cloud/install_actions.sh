#!/bin/bash -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT_NAME=$(basename "${BASH_SOURCE[0]}")

echoerr() {
  >&2 echo "$@"
}

usage() {
  cat << EOF
Usage:
  ${SCRIPT_NAME} BUCKET_NAME ACTION_DIR ACTION...

Arguments
  BUCKET_NAME The GCS bucket to use when fetching actions
  ACTION_DIR The path on the filesystem where actions should be fetched
  ACTION The names of the actions to install (without filename suffix)
EOF
}

if [[ $# -lt 3 ]]; then
  echoerr "No actions provided"
  usage
  exit 1
fi

BUCKET_NAME="$1"
shift
if [[ -z "${BUCKET_NAME}" ]]; then
  echoerr "Invalid bucket name"
  usage
  exit 1
fi

ACTION_DIR="$1"
shift

if [[ -z "${ACTION_DIR}" ]]; then
  echoerr "Invalid action path"
  usage
  exit 1
fi

echo "Creating action directory: ${ACTION_DIR}"
mkdir -p "${ACTION_DIR}"
cd "${ACTION_DIR}"

BASE_DIR=$(pwd)

ACTIONS=$(for ACTION in "${@}"; do echo "${ACTION}"; done | sort | uniq)
for ACTION in ${ACTIONS[@]}; do
  cd "${BASE_DIR}"
  ACTION_UUID=$(uuidgen)

  echo "Fetching action '${ACTION}' into ${ACTION_UUID}"
  gsutil -q cp "gs://${BUCKET_NAME}/${ACTION}.tgz" "${ACTION_UUID}.tgz"

  mkdir "${ACTION_UUID}"
  tar -xzvf "${ACTION_UUID}.tgz" -C "${ACTION_UUID}"

  cd "${ACTION_UUID}"
  npm --quiet --no-package-lock --no-progress install > /dev/null
  cd "${BASE_DIR}"
  rm "${ACTION_UUID}.tgz"
done
