const Validator = require('./validator')
const core = require('@actions/core')
const { issueCommand } = require("@actions/core/lib/command")
const reporter = require('./reporter')

async function run() {
  try {
    const mode = core.getInput('mode')
    if (mode === 'org') {
      console.log(`Validating organization policies in: <repo>/policies`)
      const validator = new Validator(mode, process.env.GITHUB_WORKSPACE || '')
      await validator.validate()
      reporter(validator, core, issueCommand, console)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()