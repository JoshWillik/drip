'use strict'

const error = require('./error')

class Lexer {
  constructor (input, filename) {
    if (typeof input !== 'string') {
      throw new Error('Lexer input must be a string, got ' + typeof input)
    }

    this.filename = filename
    this.input = input
    this.originalInput = this.input

    this.line = 1
    this.column = 1

    this.tokens = []
    this.lastToken = null

    this.ended = false
  }

  getTokens () {
    while (!this.ended) {
      this.advance()
    }

    return this.tokens
  }

  error (code, message) {
    throw error(code, message, {
      line: this.line,
      column: this.column,
      filename: this.filename,
      src: this.originalInput
    })
  }

  token (type, value) {
    let token = {
      type,
      column: this.column,
      line: this.line
    }

    if (typeof type === 'object') {
      for (let attr in type) {
        token[attr] = type[attr]
      }
    } else if (value) {
      token.value = value
    }

    this.tokens.push(token)
    this.lastToken = token

    return token
  }

  nextLine () {
    this.line += 1
    this.column = 1
  }

  nextColumn (num) {
    this.column += num
  }

  consume (num) {
    this.input = this.input.substr(num)
  }

  scan (regex, type) {
    let captures = regex.exec(this.input)
    if (!captures) {
      return
    }

    let len = captures[0].length
    let val
    if (captures.length > 1) {
      val = captures[1]
    }

    let token = this.token(type, val)
    this.consume(len)
    this.nextColumn(len)

    return token
  }

  blank () {
    let captures = /^[ \t]*\n?/.exec(this.input)

    if (captures && captures[0].length) {
      this.consume(captures[0].length)
      this.nextLine()
      return true
    }
  }

  doctype () {
    return this.scan(/^<!doctype html>/, 'doctype')
  }

  comment () {
    return this.scan(/^<!--(.+)-->/, 'comment')
  }

  tag () {
    return this.scan(/^<([^ <>\/]+)/, 'tag')
  }

  attribute () {
    let last = this.lastToken
    if (!last || last.type !== 'tag') {
      return false
    }

    let captures = /^([a-zA-Z]+)(=(["a-zA-Z]+))?/.exec(this.input)
    if (captures) {
      let len = captures[0].length
      let name = captures[1]
      let value = true
      if (captures.length === 3) {
        value = captures[2]
      }
      this.consume(len)
      this.nextColumn(len)
      this.token({
        type: 'attribute',
        name: name,
        value: value
      })
      return true
    }
  }

  tagEnd () {
    return this.scan(/^>/, 'tagEnd')
  }

  text () {
    return this.scan(/^([^<>]+)/, 'text')
  }

  closingTag () {
    return this.scan(/^<\/([^ <>]+)>/, 'closingTag')
  }

  eos () {
    if (this.input.length) {
      return
    }

    this.token('eos')
    this.ended = true
    return true
  }

  fail () {
    let input = this.input.substr(0, 5)
    input = input.replace(/\n/g, '\\n\n')
    this.error('UNEXPECTED_TEXT', `Unexpected text: "${input}"`)
    return true
  }

  advance () {
    let steps = [
      'blank',
      'doctype',
      'comment',
      'tag',
      'attribute',
      'tagEnd',
      'text',
      'closingTag',
      'eos',
      'fail'
    ]

    for (let step of steps) {
      let val = this[step]()
      if (val) {
        return
      }
    }
  }
}

module.exports = function (input, filename, options) {
  let lexer = new Lexer(input, filename, options)
  return lexer.getTokens()
}
module.exports.Lexer = Lexer
