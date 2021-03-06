const moment = require('moment')
const metadata = require('probot-metadata')
const configuration = require('./config')

module.exports = {
  async setReminder (context) {
    let config
    try {
      config = await context.config('config.yml', configuration.defaults)
    } catch (err) {
      config = configuration.defaults
    }

    if (config.reminder.available) {
      const { owner, repo } = context.repo()
      const q = `label:"${config.reminder.label.waiting.name}" repo:${owner}/${repo}`

      const resp = await context.github.search.issues({ q })
      let lastLabels = []
      await Promise.all(resp.data.items.map(async issue => {
        issue = context.repo(issue)
        const { owner, repo, number } = issue

        const timeout = await metadata(context, issue).get('timeout')

        if (timeout) {
          const due = timeout.due
          if (!due) {
            // Malformed metadata, not much we can do
            await context.github.issues.removeLabel({
              owner,
              repo,
              number,
              name: config.reminder.label.waiting.name
            })
          } else if (moment(due) > moment()) {
            const remainingPercentage = ((Date.parse(due) - new Date()) / (Date.parse(due) - Date.parse(timeout.created))) * 100

            const dynamicLabel = `${config.reminder.label.time_out.name}: ${Math.round(remainingPercentage)}% :hourglass_flowing_sand:`

            const labels = issue.labels

            const lastLabel = labels.find(label => {
              return label.name.split(':')[0] === config.reminder.label.time_out.name
            })
            if (lastLabel) {
              lastLabels.push(lastLabel)
              const pos = labels.indexOf(lastLabel)
              labels.splice(pos, 1)
            }
            labels.push(Object.assign({ name: dynamicLabel }, { color: config.reminder.label.time_out.color }))

            await context.github.issues.edit({ owner, repo, number, labels, state: issue.state })
          } else if (moment(due) <= moment()) {
            await context.github.issues.removeLabel({ owner, repo, number, name: config.reminder.label.waiting.name })
          }
        }
      }))

      await Promise.all(lastLabels.map(async label => {
        const q = `label:"${label.name}" repo:${owner}/${repo}`
        const resp = await context.github.search.issues({ q })

        if (resp.data.items.length === 0) {
          let name = label.name
          context.github.issues.deleteLabel({ owner, repo, name })
        }
      }))
    }
  }
}
