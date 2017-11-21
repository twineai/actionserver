/**
 * An error which can occur when an action module was loaded but was ill-formed.
 */
class ActionConfigError extends Error {
  constructor(...args) {
    super(...args)
    Error.captureStackTrace(this, ActionConfigError)
  }
}

module.exports.ActionConfigError = ActionConfigError;
