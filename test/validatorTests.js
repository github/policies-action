const { expect } = require('chai')
const proxyquire = require('proxyquire')

var files = {}

var Validator = proxyquire('../validator', {
  fs: {
    readFileSync: (name, encoding) => {
      return files[name]
    }
  },
  'recursive-readdir': (root, pattern) => Object.keys(files),
})

describe('validator', () => {
  it('finds a valid file', async () => {
    files = {
      'foo.yaml': '{ id: foo, name: fooName, for: repositories }',
    }
    const validator = new Validator('org', null)
    await validator.validate()
    const counts = validator.getCounts()
    expect(counts.total).to.eq(1)
    expect(counts.invalid).to.eq(0)
    expect(counts.problemPolicy).to.eq(0)
    expect(counts.warning).to.eq(0)
    expect(counts.error).to.eq(0)
  })


  it('finds an invalid YAML file', async () => {
    files = {
      'foo.yaml': 'iditor: ies:',
    }
    const validator = new Validator('org', null)
    await validator.validate()
    const counts = validator.getCounts()
    expect(counts.total).to.eq(1)
    expect(counts.invalid).to.eq(1)
    expect(counts.problemPolicy).to.eq(0)
    expect(counts.warning).to.eq(0)
    expect(counts.error).to.eq(0)
  })

  it('finds a missing key', async () => {
    files = {
      'foo.yaml': '{ id: foo, for: repositories }',
    }
    const validator = new Validator('org', null)
    await validator.validate()
    const counts = validator.getCounts()
    expect(counts.total).to.eq(1)
    expect(counts.invalid).to.eq(0)
    expect(counts.problemPolicy).to.eq(1)
    expect(counts.warning).to.eq(0)
    expect(counts.error).to.eq(1)
  })

  it('finds two missing keys', async () => {
    files = {
      'foo.yaml': '{ for: repositories }',
    }
    const validator = new Validator('org', null)
    await validator.validate()
    const counts = validator.getCounts()
    expect(counts.total).to.eq(1)
    expect(counts.invalid).to.eq(0)
    expect(counts.problemPolicy).to.eq(1)
    expect(counts.warning).to.eq(0)
    expect(counts.error).to.eq(2)
  })

  it('finds duplicate ids and missing keys', async () => {
    files = {
      'foo.yaml': '{ id: foo, name: fooName, for: repositories }',
      'bar.yaml': '{ id: bar, for: repositories }',
      'test/bar.yaml': '{ id: bar, name: barName, for: repositories }',
    }
    const validator = new Validator('org', null)
    await validator.validate()
    const counts = validator.getCounts()
    expect(counts.total).to.eq(3)
    expect(counts.invalid).to.eq(0)
    expect(counts.problemPolicy).to.eq(2)
    expect(counts.warning).to.eq(0)
    expect(counts.error).to.eq(3)
  })
})
