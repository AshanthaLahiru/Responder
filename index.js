module.exports = (robot) => {
  let async = require("async-promises")

  robot.on('issues.opened', async context => {
    const contextSummary = context.issue();

    commentsForRepoParams = context.issue({ number: 29 });

    context.github.repos.getContributors(commentsForRepoParams)
      .then(contributors => {

        contributorsIds = [];

        if (contributors.data && Array.isArray(contributors.data)) {
          contributors.data.forEach(contributor => {
            contributorsIds.push(contributor.id);
          })
        }
        if (!contributorsIds.includes(context.payload.repository.owner.id)) {
          contributorsIds.push(context.payload.repository.owner.id);
        }

        return contributorsIds;
      })
      .then(contributorsIds => {

        console.log(">>>>>>>>IDs");
        console.log(contributorsIds);
        console.log("<<<<<<<<IDs");

        let issueParams = context.issue({state: "all"});

        return context.github.issues.getForRepo(issueParams)
          .then(issuesForRepo => {

            let asyncActivities = [];
            if (issuesForRepo.data && Array.isArray(issuesForRepo.data)) {
              issuesForRepo.data.forEach(issue => {
                if (contextSummary.number != issue.number) {
                  asyncActivities.push(() => {
                    commentsForRepoParams = context.issue({ number: issue.number });
                    return context.github.issues.getComments(commentsForRepoParams)
                      .then(commentsForIssue => {

                        if (commentsForIssue.data.length == 0) {
                          return -1;
                        } else {
                          for (let x = 0; x < commentsForIssue.data.length; x++) {
                            let comment = commentsForIssue.data[x];
                            if (contributorsIds.includes(comment.user.id)) {
                              let firstResponseTime = 0;
                              firstResponseTime = (Date.parse(comment.created_at) - Date.parse(issue.created_at)) / 1000;

                              return firstResponseTime;
                              break;
                            } else if (x == commentsForIssue.data.length - 1) {
                              return -1;
                            }
                          }
                        }

                      })

                  })
                }
              })
            }
            return async.parallel(asyncActivities);
          })
      })
      .then(firstResponseTimes => {

        console.log(">>>>>>>>firstResponseTimes");
        console.log(firstResponseTimes);
        console.log("<<<<<<<<firstResponseTimes");

        let totalTime = 0, totalCount = 0;
        for (let x = 0; x < firstResponseTimes.length; x++) {
          if (firstResponseTimes[x] && firstResponseTimes[x] != -1) {
            totalTime += firstResponseTimes[x];
            totalCount++;
          }
        }

        console.log(">>>>>>>>totalTime");
        console.log(totalTime);
        console.log("<<<<<<<<totalTime");

        console.log(">>>>>>>>totalCount");
        console.log(totalCount);
        console.log("<<<<<<<<totalCount");

        let averageResponseTime = totalTime / totalCount;
        let formattedResponseTime;
        if (!totalTime || totalTime == 0) {
          formattedResponseTime = "soon";
        } else if (averageResponseTime < 3600) {
          formattedResponseTime = Math.ceil(averageResponseTime / 60) + " minutes";
        } else if (averageResponseTime < 3600 * 24) {
          formattedResponseTime = Math.ceil(averageResponseTime / 3600) + " hours";
        } else {
          formattedResponseTime = Math.ceil(averageResponseTime / (3600 * 24)) + " days";
        }

        let commentMessage;
        if (formattedResponseTime == "soon") {
          commentMessage = 'Thank you for openning an issue. We appreciate your contribution towards the project, someone will get back to you ' + formattedResponseTime + '. :hourglass: ';
        } else {
          commentMessage = 'Thank you for openning an issue. We appreciate your contribution towards the project, someone will get back to you within ' + formattedResponseTime + '. :hourglass: ';
        }
        const commentParams = context.issue({ body: commentMessage });

        // return context.github.issues.createComment(commentParams);
      })
  })
}
