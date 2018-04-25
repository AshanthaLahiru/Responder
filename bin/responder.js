const moment = require('moment')
const configuration = require('./config')

module.exports = {
    async setResponse(context) {
        let config

        context.log(context)

        try {
            config = await context.config('sert.yml', configuration.defaults)
        } catch (err) {
            config = configuration.defaults
        }

        const contextSummary = context.issue()
        let contributors = (await context.github.repos.getContributors(contextSummary)).data

        let contributorsIds = []
        if (contributors && Array.isArray(contributors)) {
            contributors.forEach(contributor => {
                contributorsIds.push(contributor.id)
            })
        }
        if (!contributorsIds.includes(context.payload.repository.owner.id)) {
            contributorsIds.push(context.payload.repository.owner.id)
        }

        console.log('>>>>>>>>IDs')
        console.log(contributorsIds)
        console.log('<<<<<<<<IDs')

        let issueParams = context.issue({ state: 'all' })
        let issuesForRepo = (await context.github.issues.getForRepo(issueParams)).data

        if (issuesForRepo && Array.isArray(issuesForRepo)) {
            let firstResponseTimes = await Promise.all(issuesForRepo.map(async issue => {
                if (contextSummary.number !== issue.number) {
                    let commentsForRepoParams = context.issue({ number: issue.number })
                    let commentsForIssue = (await context.github.issues.getComments(commentsForRepoParams)).data
                    if (commentsForIssue.length === 0) {
                        return -1
                    } else {
                        for (let x = 0; x < commentsForIssue.length; x++) {
                            let comment = commentsForIssue[x]
                            if (contributorsIds.includes(comment.user.id)) {
                                let firstResponseTime = 0
                                firstResponseTime = (Date.parse(comment.created_at) - Date.parse(issue.created_at)) / 1000

                                return firstResponseTime
                            } else if (x === commentsForIssue.length - 1) {
                                return -1
                            }
                        }
                    }
                }
            })
            )
            console.log('>>>>>>>>firstResponseTimes')
            console.log(firstResponseTimes)
            console.log('<<<<<<<<firstResponseTimes')

            let totalTime = 0
            let totalCount = 0
            for (let x = 0; x < firstResponseTimes.length; x++) {
                if (firstResponseTimes[x] && firstResponseTimes[x] !== -1) {
                    totalTime += firstResponseTimes[x]
                    totalCount++
                }
            }

            console.log('>>>>>>>>totalTime')
            console.log(totalTime)
            console.log('<<<<<<<<totalTime')

            console.log('>>>>>>>>totalCount')
            console.log(totalCount)
            console.log('<<<<<<<<totalCount')

            let averageResponseTime = totalTime / totalCount
            let formattedResponseTime
            if (!totalTime || totalTime === 0) {
                formattedResponseTime = 'soon'
            } else if (averageResponseTime < 3600) {
                formattedResponseTime = Math.ceil(averageResponseTime / 60) + ' minutes'
            } else if (averageResponseTime < 3600 * 24) {
                formattedResponseTime = Math.ceil(averageResponseTime / 3600) + ' hours'
            } else {
                formattedResponseTime = Math.ceil(averageResponseTime / (3600 * 24)) + ' days'
            }

            let commentMessage
            if (formattedResponseTime === 'soon') {
                commentMessage = config.soonResponseComment
            } else {
                commentMessage = `${config.responseComment} ${formattedResponseTime}. :hourglass: <br/><br/>`
            }

            if (config.categories) {
                let eventType = context.event === 'issues' ? 'issue' : 'pull request'

                if (config.guideComment) {
                    commentMessage = `${commentMessage} ${config.guideComment} <br/><br/>`
                } else {
                    bodyMsg = `${commentMessage} It would be helpful if you can categorize this ${eventType} under following categories. \n\n `
                }

                for (let x = 0; x < config.categories.length; x++) {
                    commentMessage = bodyMsg.concat('- `/cat-' + config.categories[x].keyword + '-` : ' + config.categories[x].label.description + '<br/>')
                }
            }

            const commentParams = context.issue({ body: commentMessage })

            await context.github.issues.createComment(commentParams)

            const { labels } = context.payload.issue
            labels.push(config.waitingLabel)
            let reminder = moment().add(formattedResponseTime.split(' ')[0], formattedResponseTime.split(' ')[1]).format()

            const timeout = {
                created: context.payload.issue.created_at,
                due: reminder
            }

            await metadata(context).set('timeout', timeout)
            await context.github.issues.addLabels(context.issue({ labels }))
        }
    }
}