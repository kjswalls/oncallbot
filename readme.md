# On Call Bot ![robot icon](https://i.imgur.com/WoiMaxP.png)

A Slack app to help the Consumer Services group at ZapLabs assign engineers to be "on call" for monolith release nights in case anything breaks. 🤙🤖

It's meant to replace the spreadsheet we've been using to keep track of whose turn it is to be online for a release. Some nice features:
* Can automatically assign engineers to a release
* Creates reminders for anyone assigned to a release
* Can't remember if you're on call tonight? No need to find the wiki, just type `/oncall` to find out
* Never leave Slack! The dream

![Gif illustrating basic /oncall command usage](http://i.imgur.com/rounAl8.gif)

### Table of Contents  
[How To Use](#how-to-use)  
[Automatic Assignment](#automatic-assignment)
[Development](#development)
[Credits](#credits)
[License](#license)

## How To Use

### View Release Info
<details><summary>Show / Hide</summary>
<p>

#### Use the GUI:

Type the `/oncall` command in the Consumer Services Group channel (or any other Slack channel the bot has been added to) and use the menu that appears to choose a release you want to see. This flow is illustrated in the GIF above.

#### Use a command:

`/oncall 18.9.1`

This command will display the information for the release named **18.9.1** if exists, or will open a modal for adding the release if it hasn't been created yet in the app.

![Gif illustrating the /oncall X.X.X command usage](http://i.imgur.com/iNDGfsl.gif)

</p>
</details>

### Assign Engineers
<details><summary>Show / Hide</summary>
<p>

#### Use the GUI:

Once you've selected a release to view, click the **Assign engineer** button to open a modal for assigning an engineer. Choose the engineer's name from the dropdown, and then decide whether you're assigning them as _on call_ or _backup_. In order to assign someone to a release, that person needs to have already been added to the pool of available engineers. See [Add an engineer to the pool](#add-an-engineer-to-the-pool)

Using the GUI only allows for assigning one engineer at a time.

![Gif showing how to use the Assign Engineer button](http://i.imgur.com/1HmOZ8c.gif)

#### Use a command:

`/oncall 18.9.1 -o @willem.jager -b @hai.phan @jonathan.anstett`

Use this command to assign engineers to a release (`18.9.1`) as either on call (`-o`) or backup (`-b`). This command doesn't overwrite any engineers already assigned - it only adds new ones.

</p>
</details>

### Remove an Engineer 

<details><summary>Show / Hide</summary>
<p>

#### Use the GUI:

Once you've selected a release to view, click the **Remove engineer** button to open a modal for removing an engineer. Choose to remove either an _on call_ engineer, a _backup_ engineer, or one of each.

Using the GUI only allows for removing two engineers at a time: one backup and one primary.

![Gif showing how to use the Remove Engineer button](http://i.imgur.com/kfPIohU.gif)

#### Use a command:

`/oncall 18.9.1 -r @kirby.walls @renee.gallison`

Use this command to remove (`-r`) engineers from a release (`18.9.1`). This command allows for removing multiple engineers at once, with no need to specify whether they're on call or backup.

</p>
</details>

### Add a Release

<details><summary>Show / Hide</summary>
<p>

#### Use the GUI:

Type the `/oncall` command to open the initial menu and use the **Add a release** button to open a modal for creating a release. Enter the release's name with the format `YY.M.X`, and then enter the date that the release goes live.

![Gif showing how to use the Add Release button](http://i.imgur.com/OZHgc3A.gif)

#### Use a command:

`/oncall 19.5.1`

This command will open a modal for adding a release (`19.5.1`) if it hasn't been created yet in the app.

`/oncall 19.5.1 5/3/19`

This command bypasses the modal and creates a new release (`19.5.1`) on the specified date (`5/3/19`) if that release doesn't already exist.

</p>
</details>

### Edit Release Info

<details><summary>Show / Hide</summary>
<p>

#### Use the GUI:

Once you've selected a release to view, click the **Edit release info** button to open a modal for editing. Edit the release name and/or launch date and then click **Save**.

![Gif showing how to use the Edit Release button](http://i.imgur.com/OG4seE9.gif)

#### Use a command:

`/oncall 19.5.1 5/3/19`

This command opens a modal for updating a release (`19.5.1`) with the specified date (`5/3/19`) if that release _does_ already exist.

</p>
</details>

### View Previous Releases

<details><summary>Show / Hide</summary>
<p>

#### Use the GUI:

If you're trying to edit a release's assignments, sometimes it's helpful to see releases prior to it so you know who has been recently on call. Once you've selected a release to view, click the **Last 3 releases** button to open a message with the previous 3 releases and their assignments. This message is only visible to you.

![Gif showing how to use the Last 3 releases button](http://i.imgur.com/7UzYvoX.gif)

</p>
</details>

### Manage the Pool of Engineers

<details><summary>Show / Hide</summary>
<p>

Engineers are only assignable to a release if they've been added to the pool. This is to ensure that On Call Bot knows the discipline (frontend or backend) and pod that each engineer belongs to, so it can assign engineers to releases automatically. See [Automatic Assignment](#automatic-assignment)

#### Add an engineer to the pool:

Once you've selected a release to work with, click the **Manage the engineer pool** button to open the management view. Then click the **Add an engineer to the pool** button to open a modal for adding a new engineer. Choose the engineer's name from the dropdown (populated from Slack users in the current channel), and then select a discipline and pod that the engineer belongs to.

![Gif showing how to add an engineer to the pool](http://i.imgur.com/QgX7zE4.gif)

#### Remove an engineer from the pool:

Once you've selected a release to work with, click the **Manage the engineer pool** button to open the management view. Then click the **Remove engineer** button to open a modal for removing an existing engineer. Choose the engineer's name from the dropdown and click the **Remove** button.

</p>
</details>

## Automatic Assignment


## Development

First, clone / download the repo. 😊 Use the `variables.env.sample` to create a `variables.env` file to set environment variables (and do the same with the `variables.env.now.sample` file if you're going to deploy with Now).

To test this bot locally, you'll need to create a Slack App in a workspace you can test with. It's super quick; their docs are [here](https://api.slack.com/slack-apps#creating_apps)

You'll also need some way for your Slack App to make requests to the bot's Node / Express server while it's running locally, so you can test changes quickly. I used [localtunnel](https://www.npmjs.com/package/localtunnel) (wrapped by the super handy [localtunnel-restarter](https://github.com/kirillshevch/localtunnel-restarter) package to auto-restart LT when it crashes), but you can also use [ngrok](https://ngrok.com/) or any other cool wizardry.

Start the Express server like this:

```
$ cd oncallbot
$ npm run dev
```

And make it available on the web like this (in another terminal session):

```
$ localtunnel-restarter --port 7777 --subdomain oncallbot
```

Then you'll need to set up **Interactive Components**, **Slash Commands**, and **Permissions** for the Slack App.

### Interactive Components

The main thing here is the Request URL. The Express server expects actions from interactive components to be sent to the `/slack/actions` route, so if you're using localtunnel as detailed above, you should set the Request URL in the Slack App dashboard to be `https://oncallbot.localtunnel.me/slack/actions`.

### Slash Commands

Likewise, you'll need to create the Slash command `/oncall` in the Slack App dashboard with the Request URL: `https://oncallbot.localtunnel.me/slack/command/oncall` (if you're using localtunnel).

### Permissions

The app needs the following Permission Scopes, set in the **OAuth and Permissions** tab of the Slack dashboard:
* chat:write:user
* commands
* reminders:write
* users:read

Then you need to save some Slack tokens to the `variables.env` file in the repo:
1. Get the **OAuth Access Token** from the **Install App** page of the Slack dashboard, and set it as the SLACK_ACCESS_TOKEN environment variable.
2. Get the **Verification Token** from the **Basic Information page of the dashboard and set it as the SLACK_VERIFICATION_TOKEN.

Now the Slack App should be good to go! You just need to set up a MongoDB database with an admin user. I used [mLab](https://mlab.com/) to host the database, but you can also run one locally. Either way, grab the connection string and save it as the DATABASE env variable: `DATABASE=mongodb://USERNAME:PASSWORD@abc123.mlab.com:77777/on-call-bot`

Finally you're ready to start using the app! The `dev` script in package.json uses `nodemon` to hot-reload when you save changes to a file and `ndb` to debug the JavaScript. It runs on port 7777 by default (specified in `variables.env`).

Now you should be able to talk to the app in one of your Slack workspace's channels with the `/oncall` command.

## Credits
The robot icon the app uses was made by [Darius Dan](https://www.flaticon.com/authors/darius-dan) from [www.flaticon.com](https://www.flaticon.com/) and is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/). Thank you Darius Dan and FlatIcon!

## License
[MIT](https://choosealicense.com/licenses/mit/) © 2018 Kirby Walls