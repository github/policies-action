const { expect } = require('chai')
const sinon = require('sinon')
const reporter = require('../reporter')

describe('reporter', () => {
  it('reports a valid file', async () => {
    const policies = [
      { file: 'foo.yaml', issues: [] }
    ]
    const { validator, core, annotator, log } = setup(policies, 1, 0, 0, 0, 0)
    reporter(validator, core, annotator, log)
    expect(annotator.notCalled).to.be.true
    expect(log.log.getCall(0).args[0]).to.eq('Checked 1 potential policy file.')
    expect(log.log.getCall(1).args[0]).to.eq('Everything looks good.')
    expect(annotator.calledOnce).to.be.false
    expect(core.setFailed.calledOnce).to.be.false
  })

  it('reports on invalid file', async () => {
    const policies = [
      { file: 'foo.yaml', issues: [{ status: 'error', message: 'foo' }] }
    ]
    const { validator, core, annotator, log } = setup(policies, 1, 1, 0, 0, 0)
    reporter(validator, core, annotator, log)
    expect(log.log.getCall(0).args[0]).to.eq('Checked 1 potential policy file.')
    expect(log.log.getCall(1).args[0]).to.eq('Found 1 invalid YAML file and 0 files with errors or warnings.')
    expect(annotator.getCall(0).args[0]).to.eq('error')
    expect(annotator.getCall(0).args[1].file).to.eq('foo.yaml')
    expect(annotator.getCall(0).args[2]).to.eq('foo')
    expect(core.setFailed.calledOnce).to.be.true
    expect(core.setFailed.getCall(0).args[0]).to.eq('Found 1 problem in 1 potential policy file.')
  })

  it('reports missing key', async () => {
    const policies = [
      { file: 'foo.yaml', issues: [{ status: 'error', message: 'foo' }] }
    ]
    const { validator, core, annotator, log } = setup(policies, 1, 0, 1, 1, 0)
    reporter(validator, core, annotator, log)
    expect(annotator.calledOnce).to.be.true
    expect(log.log.getCall(0).args[0]).to.eq('Checked 1 potential policy file.')
    expect(log.log.getCall(1).args[0]).to.eq('Found 0 invalid YAML files and 1 file with 1 error and 0 warnings.')
    expect(annotator.getCall(0).args[0]).to.eq('error')
    expect(annotator.getCall(0).args[1].file).to.eq('foo.yaml')
    expect(annotator.getCall(0).args[2]).to.eq('foo')
    expect(core.setFailed.calledOnce).to.be.true
    expect(core.setFailed.getCall(0).args[0]).to.eq('Found 1 problem in 1 potential policy file.')
  })

  it('reports two missing keys', async () => {
    const policies = [
      { file: 'foo.yaml', issues: [{ status: 'error', message: 'foo' }, { status: 'error', message: 'bar' }] }
    ]
    const { validator, core, annotator, log } = setup(policies, 1, 0, 1, 2, 0)
    reporter(validator, core, annotator, log)
    expect(annotator.calledTwice).to.be.true
    expect(log.log.getCall(0).args[0]).to.eq('Checked 1 potential policy file.')
    expect(log.log.getCall(1).args[0]).to.eq('Found 0 invalid YAML files and 1 file with 2 errors and 0 warnings.')
    expect(annotator.getCall(0).args[0]).to.eq('error')
    expect(annotator.getCall(0).args[1].file).to.eq('foo.yaml')
    expect(annotator.getCall(0).args[2]).to.eq('foo')
    expect(annotator.getCall(1).args[0]).to.eq('error')
    expect(annotator.getCall(1).args[1].file).to.eq('foo.yaml')
    expect(annotator.getCall(1).args[2]).to.eq('bar')
    expect(core.setFailed.calledOnce).to.be.true
    expect(core.setFailed.getCall(0).args[0]).to.eq('Found 2 problems in 1 potential policy file.')
  })

  it('finds duplicate ids and missing keys', async () => {
    const policies = [
      { file: 'foo.yaml', issues: [] },
      { file: 'bar.yaml', issues: [{ status: 'error', message: 'duplicate' }, { status: 'error', message: 'bar' }] },
      { file: 'test/bar.yaml', issues: [{ status: 'error', message: 'duplicate' },] }
    ]
    const { validator, core, annotator, log } = setup(policies, 3, 0, 2, 3, 0)
    reporter(validator, core, annotator, log)
    expect(log.log.getCall(0).args[0]).to.eq('Checked 3 potential policy files.')
    expect(log.log.getCall(1).args[0]).to.eq('Found 0 invalid YAML files and 2 files with 3 errors and 0 warnings.')
    expect(annotator.calledThrice).to.be.true
    expect(annotator.getCall(0).args[0]).to.eq('error')
    expect(annotator.getCall(0).args[1].file).to.eq('bar.yaml')
    expect(annotator.getCall(0).args[2]).to.eq('duplicate')
    expect(annotator.getCall(1).args[0]).to.eq('error')
    expect(annotator.getCall(1).args[1].file).to.eq('bar.yaml')
    expect(annotator.getCall(1).args[2]).to.eq('bar')
    expect(annotator.getCall(2).args[0]).to.eq('error')
    expect(annotator.getCall(2).args[1].file).to.eq('test/bar.yaml')
    expect(annotator.getCall(2).args[2]).to.eq('duplicate')

    expect(core.setFailed.calledOnce).to.be.true
    expect(core.setFailed.getCall(0).args[0]).to.eq('Found 3 problems in 3 potential policy files.')
  })
})

function setup(policies, total, invalid, problemPolicy, error, warning) {
  const counts = { total: total, invalid, error, warning, problemPolicy }
  const validator = { policies, getCounts: () => counts }
  return {
    validator,
    core: { setFailed: sinon.spy() },
    annotator: sinon.spy(),
    log: { log: sinon.spy() }
  }
}