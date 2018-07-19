/*
 * Twine - The Twine Platform
 *
 * Copyright 2018 The Twine Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * An error which can occur when an action module was loaded but was ill-formed.
 */
class ActionConfigError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, ActionConfigError)
  }
}

/**
 * An error which can occur when an action is requested but not found.
 */
class ActionMissingError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, ActionMissingError)
  }
}

module.exports.ActionConfigError = ActionConfigError;
module.exports.ActionMissingError = ActionMissingError;
