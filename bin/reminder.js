const moment = require('moment')
const metadata = require('probot-metadata')
const configuration = require('./config')

module.exports = {
    async setReminder(context) {
        let config

        try {
            config = await context.config('sert.yml', configuration.defaults)
        } catch (err) {
            config = configuration.defaults
        }

        const { owner, repo } = context.repo()
        const q = `label:"${config.waitingLabel}" repo:${owner}/${repo}`

        const resp = await context.github.search.issues({ q })
        let lastLabels = []
        await Promise.all(resp.data.items.map(async issue => {
            issue = context.repo(issue)
            const { owner, repo, number } = issue

            const timeout = await metadata(context, issue).get('timeout')
            const due = timeout.due

            if (!due) {
                // Malformed metadata, not much we can do
                await context.github.issues.removeLabel({
                    owner,
                    repo,
                    number,
                    name: config.waitingLabel
                })
            } else if (moment(due) > moment()) {
                const remainingPercentage = ((Date.parse(due) - new Date()) / (Date.parse(due) - Date.parse(timeout.created))) * 100

                const dynamicLabel = `reponse timeout: ${Math.round(remainingPercentage)}% :hourglass_flowing_sand:`

                const labels = issue.labels

                const lastLabel = labels.find(label => {
                    return label.name.split(':')[0] === 'reponse timeout'
                })
                if (lastLabel) {
                    lastLabels.push(lastLabel)
                    const pos = labels.indexOf(lastLabel)
                    labels.splice(pos, 1)
                }
                labels.push(dynamicLabel)

                await context.github.issues.edit({ owner, repo, number, labels, state: 'open' })
            } else if (moment(due) <= moment()) {
                await context.github.issues.removeLabel({ owner, repo, number, name: config.waitingLabel })
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