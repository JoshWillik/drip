'use strict'

const lex = require('../')
const assert = require('assert')

function compareTokens (actual, expected) {

  try {
    assert.equal(actual.length, expected.length)
    for (let i in actual) {
      assert.equal(actual[i].type, expected[i].type)
    }
  } catch (e) {
    throw new Error('Actual\n' + JSON.stringify(actual, null, 2) + '\n\nExpected\n' + JSON.stringify(expected, null, 2))
  }
}

let tests = [
  {
    name: 'empty script',
    expected: [{type: 'eos'}],
    tests: [
      ``,
      `


      `
    ],
  },
  {
    name: 'doctype',
    expected: [
      {type: 'doctype'},
      {type: 'eos'}
    ],
    tests: [
      `<!doctype html>`,
      `<!doctype html>               `,
    ],
  },
  {
    name: 'basic tag',
    expected: [
      {type: 'tag', value: 'html'},
      {type: 'tagEnd'},
      {type: 'closingTag', value: 'html'},
      {type: 'eos'},
    ],
    tests: [
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
    expected: [
      {type: 'tag', value: 'html'},
      {type: 'tagEnd'},
      {type: 'tag', value: 'body'},
      {type: 'tagEnd'},
      {type: 'closingTag', value: 'body'},
      {type: 'closingTag', value: 'html'},
      {type: 'eos'},
    ],
    tests: [
      `<html><body></body></html>`,
      `<html> <body> </body> </html>`,
      `<html>
      <body>
      </body>
      </html>`,
      `           <html
      >
          <body>
</body>

      </html>`,
    ],
  },
  {
    name: 'comments',
    expected: [
      {type: 'tag', value: 'html'},
      {type: 'tagEnd'},
      {type: 'comment', value: 'this is a comment '},
      {type: 'tag', value: 'body'},
      {type: 'comment', value: ' a comment inside a body tag '},
      {type: 'tagEnd'},
      {type: 'closingTag', value: 'body'},
      {type: 'closingTag', value: 'html'},
      {type: 'eos'},
    ],
    tests: [
      `<html>
      <!--this is a comment -->
      <body
        <!-- a comment inside a body tag -->
      ></body></html>`,
    ],
  },
  {
    name: 'attributes',
    expected: [
      {type: 'tag', value: 'html'},
      {type: 'attribute', name: 'lang', value: `"en"`},
      {type: 'tagEnd'},
      {type: 'closingTag'},
      {type: 'eos'},
    ],
    tests: [
      '<html lang="en"></html>',
      {
        name: 'boolean attributes',
        source: '<html active></html>',
        expected: [
          {type: 'tag', value: 'html'},
          {type: 'attribute', value: true},
          {type: 'tagEnd'},
          {type: 'closingTag'},
          {type: 'eos'},
        ]
      }
    ]
  },
  {
    name: 'text',
    tests: [
      {
        source: 'hello there',
        expected: [
          {type: 'text', value: 'hello there'},
          {type: 'eos'}
        ]
      },
      {
        source: '<p>Hello <span>there</span></p>',
        expected: [
          {type: 'tag', value: 'p'},
          {type: 'tagEnd'},
          {type: 'text', value: 'Hello '},
          {type: 'tag', value: 'span'},
          {type: 'tagEnd'},
          {type: 'text', value: 'there'},
          {type: 'closingTag', value: 'span'},
          {type: 'closingTag', value: 'p'},
          {type: 'eos'}
        ]
      }
    ]
  }
]

describe('Drip', function () {
  tests.forEach(group => {
    group.tests.forEach((test, i) => {
      let name = test.name ? `should parse ${test.name}` : `should parse ${group.name} #${i+1}`

      it(name, () => {
        let sourceCode, expected
        if (test.expected) {
          sourceCode = test.source
          expected = test.expected
        } else {
          sourceCode = test
          expected = group.expected
        }

        let tokens = lex(sourceCode)
        compareTokens(tokens, expected)
      })
    })
  })
})
