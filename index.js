module.exports = (robot) => {
  robot.on('pull_request.opened', async context => {

    context.log("*******CONTEXT***********");
    context.log(context);
    context.log("*******CONTEXT***********");
    let days = "{{days}}";
    const params = context.issue({body: 'We appreciate your contribution towards the project will get back to you within ' + days + '}'});

    return context.github.issues.createComment(params);
  })
}
