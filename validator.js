const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const recursive = require("recursive-readdir")

const requiredKeys = ['for', 'id', 'name']

class Validator {
  constructor(mode, root) {
    this.mode = mode
    this.root = root || ''
    this.policies = []
  }

  async validate() {
    if (this.mode === 'org') return this.validateOrg()
    throw new Error(`Invalid validation mode: ${this.mode}`)
  }

  async validateOrg() {
    const repoRoot = path.join(this.root, 'policies')
    await this.loadPolicies(repoRoot)
    this.validatePolicies()
  }

  validatePolicies() {
    this.validateDuplicates()
    this.policies.forEach(policy => {
        this.validatePolicySyntax(policy)
    })
    this.groupByStatus()
  }

  validateDuplicates() {
    const pivoted = this.policies.reduce((result, entry) => {
      if (!entry.policy) { return result }
      const id = entry.policy.id
      result[id] = result[id] || []
      result[id].push(entry)
      return result
    }, {})
    if (pivoted.length === this.policies.length) return
    Object.values(pivoted).forEach(list => {
      if (list.length > 1)
        list.forEach(duplicate => duplicate.issues.push({ status: 'error', message: `Policy has duplicate id: ${duplicate.policy.id}` }))
    })
  }

  validatePolicySyntax(entry) {
    if (!entry.policy) return 
    requiredKeys.forEach(key => {
      if (!entry.policy[key]) entry.issues.push({ status: 'error', message: `Policy missing '${key}' clause` })
    })
  }

  async loadPolicies(root) {
    const fileTest = (file, stats) => {
      const extension = path.extname(file)
      return !stats.isDirectory() && !['.yml', '.yaml'].includes(extension)
    }
    const files = await recursive(root, [fileTest])
    files.forEach(file => {
      try {
        const policy = yaml.safeLoad(fs.readFileSync(file, 'utf8'))
        this.policies.push({ file, policy, issues: [] })
      } catch (e) {
        this.policies.push({ file, issues: [{ status: 'error', message: `YAML parse error: ${e.message}` }] })
      }
    })
  }

  getCounts() {
    const counts = this.policies.reduce((result, entry) => {
      entry.issues.length === 0 ? 0 : result.problemPolicy++
      entry.issues.forEach(issue => {
        if (issue.message.startsWith('YAML')) result.invalid++
        else if (issue.status === 'error') result.error++
        else if (issue.status === 'warning') result.warning++
      })
      return result
    }, { total: this.policies.length, invalid: 0, error: 0, warning: 0, problemPolicy: 0 })
    counts.problemPolicy -= counts.invalid
    return counts
  }

  groupByStatus() {
    this.policies.map(entry => {
      const bins = entry.issues.reduce((bins, issue) => {
        if (issue.status === 'error') bins.error.push(issue)
        if (issue.status === 'warning') bins.warning.push(issue)
        return bins
      }, { error: [], warning: [] })
      entry.issues = bins.error.concat(bins.warning)
    })
  }
}

module.exports = Validator