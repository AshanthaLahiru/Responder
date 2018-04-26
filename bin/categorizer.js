const configuration = require('./config')

module.exports = {
    async addCategory(context, command) {
        let asyncActivities = []

        try {
            config = await context.config('config.yml', configuration.defaults)
        } catch (err) {
            config = configuration.defaults
        }

        if (config.categorizer.available) {
            let subCategory = config.categorizer.categories.find(category => {
                return category.keyword === command.arguments.split('-')[1]
            })

            asyncActivities.push(await context.github.issues.deleteComment(context.issue({ id: context.payload.comment.id })))

            if (subCategory) {
                asyncActivities.push(await context.github.issues.addLabels(context.issue({ labels: [subCategory.label.name] })))
            } else {

                let bodyMsg
                if (config.categorizer.error_comment) {
                    bodyMsg = config.categorizer.error_comment + '\n\n'
                }

                for (let x = 0; x < config.categorizer.categories.length; x++) {
                    bodyMsg = bodyMsg.concat('- `/cat-' + config.categorizer.categories[x].keyword + '-` : ' + config.categorizer.categories[x].label.description + '\n')
                }

                asyncActivities.push(await context.github.issues.createComment(context.issue({ body: bodyMsg })))
            }

            Promise.all(asyncActivities)
        }
    }
}