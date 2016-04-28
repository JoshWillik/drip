'use strict'

module.exports = function (code, message, options) {
  let err = new Error(message)
  err.code = `DRIP:${code}`

  return err
}
