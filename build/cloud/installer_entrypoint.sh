#!/bin/bash -e
#
# Twine - The Twine Platform
#
# Copyright 2018 The Twine Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

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
