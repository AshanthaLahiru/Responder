# Responder

> A GitHub Integration built with [Probot](https://github.com/probot) that sets expectation for response for contributors on creation of new issues and pull requests.

## Installation

[https://github.com/apps/responder](https://github.com/apps/responder)

## Description

In open source projects any new contributor can create pull requests or issues. When contributors do one of the following things they always seek for the feedback from the existing contributors (maintainers). As the contributors are unaware when the maintainers will respond them, they have to check the activity of the repository time to time. When contributors are acknowledged properly, it is easy to keep their interest on particular project. The `Responder` is to acknowledge the contributors in a timely manner and to get the attraction of the maintainers towards the contributors in an efficient manner. This will predict the response time by calculating the average of the initial responses given by the maintainers to previous issues and pull requests. Then a bot can acknowledge the contributors when they can receive a response. Also adding a label to indicate the remaining time will grab the attention of the maintainers and help them in responding to contributors. Other than that maintainers can define categories to issues/pull requests beforehand so that contributors can use them and categorize their issues/pull requests.

## Demo
![fwfbzx0lvl](https://user-images.githubusercontent.com/24356443/39797401-9064d0e2-5379-11e8-9d27-e0387242f3e6.gif)

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

  #Calculation sample includes `open`, `closed` or `all` issues/pull requests
  activity_state: open

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
