const createScheduler = require('probot-scheduler')
const Core = require('./bin/core')

module.exports = (robot) => {
  const events = [
    'pull_request.opened',
    'issues.opened'
  ]

  createScheduler(robot, { interval: 1 * 30 * 1000 })
  robot.on(events, Core.setResponseTime)
  robot.on('schedule.repository', Core.updateLabels)
}
