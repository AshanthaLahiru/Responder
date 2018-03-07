module.exports = (robot) => {
  let async = require("async-promises")

  robot.on('issues.opened', async context => {
    const contextSummary = context.issue();

    commentsForRepoParams = context.issue({ number: 29 });

    context.github.repos.getContributors(commentsForRepoParams)
      .then(contributors => {

        contributorsIds = [];

        contributors.data.forEach(contributor => {
          contributorsIds.push(contributor.id);
        })

        return contributorsIds;
      })
      .then(contributorsIds => {
        return context.github.issues.getForRepo(contextSummary)
          .then(issuesForRepo => {

            let asyncActivities = [];

            issuesForRepo.data.forEach(issue => {
              if (contextSummary.number != issue.number) {
                asyncActivities.push(() => {
                  commentsForRepoParams = context.issue({ number: issue.number });
                  return context.github.issues.getComments(commentsForRepoParams)
                    .then(commentsForIssue => {

                      if (commentsForIssue.data.length == 0) {
                        return 0;
                      } else {
                        for (let x = 0; x < commentsForIssue.data.length; x++) {
                          let comment = commentsForIssue.data[x];
                          if (contributorsIds.includes(comment.user.id)) {
                            let firstResponseTime = 0;
                            firstResponseTime = (Date.parse(comment.created_at) - Date.parse(issue.created_at)) / 1000;

                            return firstResponseTime;
                            break;
                          } else if (x == commentsForIssue.data.length - 1) {
                            return 0;
                          }
                        }
                      }

                    })

                })
              }
            })

            return async.parallel(asyncActivities);
          })
      })
      .then(firstResponseTimes => {

        let totalTime = 0;
        for (let x = 0; x < firstResponseTimes.length; x++) {
          totalTime += firstResponseTimes[x];
        }
        console.log(totalTime)
        console.log(firstResponseTimes.length)

        let averageResponseTime = totalTime / firstResponseTimes.length;
        let formattedResponseTime;
        if (averageResponseTime < 3600) {
          formattedResponseTime = Math.ceil(averageResponseTime / 60) + " minutes";
        } else if (averageResponseTime < 3600 * 24) {
          formattedResponseTime = Math.ceil(averageResponseTime / 3600) + " hours";
        } else {
          formattedResponseTime = Math.ceil(averageResponseTime / (3600 * 24)) + " days";
        }

        const commentParams = context.issue({ body: 'Thank you for openning an issue. We appreciate your contribution towards the project, will get back to you within ' + formattedResponseTime + '. :hourglass: ' });

        return context.github.issues.createComment(commentParams);
      })
  })
}
