# SERT

> A GitHub Integration built with [Probot](https://github.com/probot) that sets expectation for response time for contributors on creation of new issues.

![sert](https://user-images.githubusercontent.com/24356443/37246416-91213284-24ce-11e8-9140-04c9a6a905de.PNG)

## Demo
![sert](https://user-images.githubusercontent.com/24356443/37774892-714738c2-2e07-11e8-8c25-c14eed0790a4.gif)

## How does the response time generate?

Once a issue is created, average response time of the initial responses given by the contributors of the repository or the organization to previous issues is calculated.

## Configuration
```sh
#Response time configuration
response:
  #Is available for pull requests
  pull_requests: true

  #Is available for issues
  issues: true

  #Response message
  reponse_message:
    soon_reponse: "Thank you for openning an issue. We appreciate your contribution towards the project, someone will get back to you soon. :hourglass:"
    time_response: "Thank you for openning an issue. We appreciate your contribution towards the project, based on the past issues someone will get back to you within"

  #Buffer time - 1 hr / 1 day
  buffer_time: 1 day

  #Limit for the calculation sample
  activities_count: 20
  
#Response time reminder configuration
reminder:
  #Is reminder function switched on 
  available: true

  label:
    #Waiting for reponse label
    waiting:
      name: waiting for response
      color: aaaaaa
    #Remaining time label
    #format: time_out label name + remmaining time + :hourglass_flowing_sand:
    time_out:
      name: response time out
      color: bbbbbb

#Categorizing configuration
categorizer:
  #Is categorizing function switched on
  available: true
  
  guide_comment: Hello there, it will be helpful if you choose one of following categories.
  error_comment: There is no such a category :worried:, please use a following category.
 
  #Categories configuration
      #Category keyword - Mandotory
      #Category label details
        #Category name
        #Catgory description
        #Label color
  categories:
    - keyword: ui
      label:
        name: 'UI :desktop_computer:' 
        color: 000007
        description: UI related
    - keyword: backend
      label:
        name: 'Backend :wrench:'
        color: 005500
        description: Backend related
    - keyword: security
      label:
        name: 'Security :lock_with_ink_pen:'
        color: 000075
        description: Security related
```

## Setup

```
# Install dependencies
npm install

# Run the bot
npm start
```

## Status
Comming Soon....

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.
