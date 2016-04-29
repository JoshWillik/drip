'use strict'

const error = require('./error')

class Lexer {
  constructor (input, filename) {
    this.filename = filename
    this.input = input
    this.originalInput = this.input

    this.line = 1
    this.column = 1

    this.tokens = []

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

    if (value) {
      token.value = value
    }

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
    let val = captures[1]
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
    let node = this.scan(/^<!doctype html>/, 'doctype')
    if (node) {
      this.tokens.push(node)
      return true
    }
  }

  tag () {
    let captures = /^<([^ <>\/]+)/.exec(this.input)
    if (captures) {
      let len = captures[0].length
      let tag = captures[1]
      this.consume(len)
      this.nextColumn(len)
      this.tokens.push(this.token('tag', tag))
      return true
    }
  }

  tagEnd () {
    let captures = /^>/.exec(this.input)
    if (captures) {
      let len = captures[0].length
      this.consume(len)
      this.nextColumn(len)
      this.tokens.push(this.token('tagEnd'))
      return true
    }
  }

  closingTag () {
    let captures = /^<\/([^ <>]+)>/.exec(this.input)
    if (captures) {
      let len = captures[0].length
      let tag = captures[1]
      this.consume(len)
      this.nextColumn(len)
      this.tokens.push(this.token('closingTag', tag))
      return true
    }
  }

  eos () {
    if (this.input.length) {
      return
    }

    this.tokens.push(this.token('eos'))
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
      'tag',
      'tagEnd',
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
