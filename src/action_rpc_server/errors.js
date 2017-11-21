/**
 * An RPC error which can be thrown from RPC methods.
 */
class RPCError extends Error {
  constructor(code, ...args) {
    super(...args)

    this.code = code;

    Error.captureStackTrace(this, RPCError)
  }

  get details() {
    return this.message;
  }
}

module.exports.RPCError = RPCError;
