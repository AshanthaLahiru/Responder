module.exports = (robot) => {
  robot.on('pull_request.opened', async context => {

    let days = "{{days}}";
    const params = context.issue({body: 'We appreciate your contribution towards the project will get back to you within ' + days + '}'});

    return context.github.pullRequests.createComment(params);
  })
}
