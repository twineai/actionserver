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
