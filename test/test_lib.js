'use strict'

const lex = require('../')
const assert = require('assert')

function compareTokens (actual, expected) {
  assert.equal(actual.length, expected.length)

  for (let i in actual) {
    assert.equal(actual[i].type, expected[i].type)
  }
}

describe('Drip', function () {
  it('should parse an empty script', function () {
    let tokens = lex(``)
    compareTokens(tokens, [
      {type: 'eos'},
    ])
  })

  it('should parse an empty script', function () {
    let tokens = lex(`



      `)
    compareTokens(tokens, [
      {type: 'eos'},
    ])
  })
  it('should parse a doctype', function () {
    let tokens = lex(`<!doctype html>`)
    compareTokens(tokens, [
      {type: 'doctype'},
      {type: 'eos'},
    ])
  })
})
