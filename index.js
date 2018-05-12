const createScheduler = require('probot-scheduler')
const commands = require('probot-commands')
const categorizer = require('./bin/categorizer')
const reminder = require('./bin/reminder')
const responder = require('./bin/responder')

module.exports = (robot) => {
  const events = [
    'pull_request.opened',
    'issues.opened'
  ]

  createScheduler(robot, { interval: 1 * 60 * 60 * 1000 })

  robot.on(events, responder.setResponse)
  robot.on('schedule.repository', reminder.setReminder)
  commands(robot, 'cat', categorizer.addCategory)
}
