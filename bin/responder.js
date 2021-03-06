const moment = require('moment')
const configuration = require('./config')
const metadata = require('probot-metadata')

module.exports = {
  async setResponse (context) {
    let config
    try {
      config = await context.config('config.yml', configuration.defaults)
    } catch (err) {
      config = configuration.defaults
    }

    if (context.event === 'issue_comment' && context.payload.action === 'created' &&
            context.payload.issue.labels.find(label => {
              return label.name === config.reminder.label.waiting.name
            }) &&
            context.payload.comment.author_association !== 'NONE') {
      const labels = context.payload.issue.labels

      let updatedLabels = labels.filter(label => {
        return !(label.name.split(':')[0] === config.reminder.label.time_out.name || label.name === config.reminder.label.waiting.name)
      })

      await context.github.issues.edit(context.issue({ labels: updatedLabels, state: context.payload.issue.state }))
    } else if (context.event === 'issues' || context.event === 'pull_request') {
      let eventType = context.event === 'issues' ? 'issue' : 'pull request'

      if ((eventType === 'issue' && config.response.issues) || config.response.pull_requests) {
        const contextSummary = context.issue()

        if ((context.payload.issue && context.payload.issue.author_association === 'NONE') ||
                    (context.payload.pull_request && context.payload.pull_request.author_association === 'NONE')) {
          let issueParams = context.issue({ state: config.response.activity_state })
          let issuesForRepo = (await context.github.issues.getForRepo(issueParams)).data

          issuesForRepo = issuesForRepo.slice(0, config.response.activities_count || 10)

          if (issuesForRepo && Array.isArray(issuesForRepo)) {
            let firstResponseTimes = await Promise.all(issuesForRepo.map(async issue => {
              if (contextSummary.number !== issue.number) {
                let commentsForRepoParams = context.issue({ number: issue.number })
                let commentsForIssue = (await context.github.issues.getComments(commentsForRepoParams)).data
                let firstRespondComment = commentsForIssue.find((comment) => {
                  return comment.author_association !== 'NONE'
                })

                if (firstRespondComment) {
                  return (Date.parse(firstRespondComment.created_at) - Date.parse(issue.created_at)) / 1000
                } else {
                  return -1
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
              } else if (firstResponseTimes[x] === -1) {
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

            if (config.response.buffer_time) {
              averageResponseTime += moment.duration(Number(config.response.buffer_time.split(' ')[0]), config.response.buffer_time.split(' ')[1]).asSeconds()
            }

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
              commentMessage = config.response.reponse_message.soon_reponse
            } else {
              commentMessage = `${config.response.reponse_message.time_response} ${formattedResponseTime}. :hourglass: <br/><br/>`
            }

            if (config.categorizer.available) {
              if (config.categorizer.guideComment) {
                commentMessage = `${commentMessage} ${config.categorizer.guide_comment} <br/><br/>`
              } else {
                commentMessage = `${commentMessage} It would be helpful if you can categorize this ${eventType} under following categories. \n\n `
              }

              for (let x = 0; x < config.categorizer.categories.length; x++) {
                commentMessage = commentMessage.concat('- `/cat-' + config.categorizer.categories[x].keyword + '-` : ' + config.categorizer.categories[x].label.description + '\n')
              }
            }

            const commentParams = context.issue({ body: commentMessage })

            await context.github.issues.createComment(commentParams)

            const { labels } = context.payload.issue
            labels.push(config.reminder.label.waiting)
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
    }
  }
}
