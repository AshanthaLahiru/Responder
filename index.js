const metadata = require('probot-metadata')
const moment = require('moment')
const createScheduler = require('probot-scheduler')

module.exports = (robot) => {
  createScheduler(robot, { interval: 1 * 30 * 1000 })
  robot.on(['pull_request.opened', 'issues.opened'], async context => {
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
        commentMessage = 'Thank you for openning an issue. We appreciate your contribution towards the project, someone will get back to you ' + formattedResponseTime + '. :hourglass: '
      } else {
        commentMessage = 'Thank you for openning an issue. We appreciate your contribution towards the project, based on past issues someone will get back to you within ' + formattedResponseTime + '. :hourglass: '
      }
      const commentParams = context.issue({ body: commentMessage })

      await context.github.issues.createComment(commentParams)

      const { labels } = context.payload.issue
      labels.push('waiting for response')
      let reminder = moment().add(formattedResponseTime.split(' ')[0], formattedResponseTime.split(' ')[1]).format()

      const timeout = {
        created: context.payload.issue.created_at,
        due: reminder
      }

      await metadata(context).set('timeout', timeout)
      await context.github.issues.addLabels(context.issue({ labels }))
    }
  })

  robot.on('schedule.repository', async context => {
    // let config

    // try {
    //   config = await context.config('config.yml', defaults)
    // } catch (err) {
    //   config = defaults
    // }

    const { owner, repo } = context.repo()
    const q = `label:"waiting for response" repo:${owner}/${repo}`

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
          name: 'waiting for response'
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
        await context.github.issues.removeLabel({ owner, repo, number, name: 'waiting for response' })
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
  })
}
