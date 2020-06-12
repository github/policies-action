const pluralize = require('pluralize')

function reportIssues(validator, core, annotator, log) {
  // Log some good stuff to the console and report the overall error (if any)
  const counts = validator.getCounts()
  log.log(`Checked ${pluralString(counts.total, 'potential policy file')}.`)
  if (counts.problemPolicy + counts.invalid === 0)
    log.log('Everything looks good.')
  else {
    let message = `Found ${pluralString(counts.invalid, 'invalid YAML file')} and `
    if (counts.problemPolicy) {
      message += `${pluralString(counts.problemPolicy, 'file')} with ${pluralString(counts.error, 'error')} and ${pluralString(counts.warning, 'warning')}.`
    } else {
      message += `0 files with errors or warnings.`
    }
    log.log(message)
    core.setFailed(`Found ${pluralString(counts.error + counts.warning + counts.invalid, 'problem')} in ${pluralString(counts.total, 'potential policy file')}.`)
  }

  // annotate the policies with issues
  validator.policies.forEach(policy =>
    policy.issues.forEach(issue => annotator(issue.status, { file: policy.file }, issue.message)))
}

function pluralString(count, name) {
  return `${count} ${pluralize(name, count)}`
}

module.exports = reportIssues