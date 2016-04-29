'use strict'

const lex = require('../')
const assert = require('assert')

function compareTokens (actual, expected) {
  assert.equal(actual.length, expected.length)

  for (let i in actual) {
    assert.equal(actual[i].type, expected[i].type)
  }
}

let tests = [
  {
    name: 'empty script',
    expectedTokens: [{type: 'eos'}],
    variations: [
      ``,
      `


      `
    ],
  },
  {
    name: 'doctype',
    expectedTokens: [
      {type: 'doctype'},
      {type: 'eos'}
    ],
    variations: [
      `<!doctype html>`,
      `<!doctype html>               `,
    ],
  },
  {
    name: 'basic tag',
    expectedTokens: [
      {type: 'tag', value: 'html'},
      {type: 'tagEnd'},
      {type: 'closingTag', value: 'html'},
      {type: 'eos'},
    ],
    variations: [
      `<html></html>`,
      `<html> </html>`,
      `<html>
      </html>`,
      `           <html>

      </html>`,
    ],
  },
  {
    name: 'multiple tags',
    expectedTokens: [
      {type: 'tag', value: 'html'},
      {type: 'tagEnd'},
      {type: 'tag', value: 'body'},
      {type: 'tagEnd'},
      {type: 'closingTag', value: 'body'},
      {type: 'closingTag', value: 'html'},
      {type: 'eos'},
    ],
    variations: [
      `<html><body></body></html>`,
      `<html> <body> </body> </html>`,
      `<html>
      <body>
      </body>
      </html>`,
      `           <html>
          <body>
</body>

      </html>`,
    ],
  },
]

describe('Drip', function () {
  tests.forEach(test => {
    test.variations.forEach((variation, i) => {
      it('should parse ' + test.name + ' #' + (i + 1), () => {
        let tokens = lex(variation)
        compareTokens(tokens, test.expectedTokens)
      })
    })
  })
})
