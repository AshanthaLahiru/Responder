
module.exports = {
    defaults: {
        response:
            {
                pull_requests: true,
                issues: true,
                reponse_message:
                    {
                        soon_reponse: 'Thank you for openning an issue. We appreciate your contribution towards the project, someone will get back to you soon.: hourglass: ',
                        time_response: 'Thank you for openning an issue. We appreciate your contribution towards the project, based on the past issues someone will get back to you within'
                    },
                buffer_time: '1 day',
                activity_state: 'open',
                activities_count: 20
            },

        reminder:
            {
                available: true,
                label: {
                    waiting: {
                        name: 'waiting for response',
                        color: 'aaaaaa'
                    },
                    time_out: {
                        name: 'response time out',
                        color: 'bbbbbb'
                    }
                }
            },

        categorizer:
            {
                available: true,
                guide_comment: 'Hello there, it will be helpful if you choose one of following categories.',
                error_comment: 'There is no such a category :worried:, please use a following category.',
                categories: [
                    {
                        keyword: 'ui',
                        label: {
                            name: 'UI :desktop_computer:',
                            color: '000007',
                            description: 'UI related'
                        }
                    },
                    {
                        keyword: 'backend',
                        label: {
                            name: 'Backend :wrench:',
                            color: '005500',
                            description: 'Backend related'
                        }
                    },
                    {
                        keyword: 'security',
                        label: {
                            name: 'Security :lock_with_ink_pen:',
                            color: '000075',
                            description: 'Security related'
                        }
                    }
                ]
            }
    }
}
