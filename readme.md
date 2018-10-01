# On Call Bot ![robot icon](https://i.imgur.com/WoiMaxP.png)

A Slack app to help the Consumer Services group at ZapLabs assign engineers to be "on call" for monolith release nights in case anything breaks. 🤙🤖

It's meant to replace the spreadsheet table we've been using to keep track of whose turn it is to be online for a release. Some nice features:
* Can automatically assign engineers to a release
* Creates reminders for anyone assigned to a release
* Never leave Slack! The dream

![Gif illustrating basic /oncall command usage](http://i.imgur.com/rounAl8.gif)

### Table of Contents  
[Headers](#headers)  
[Emphasis](#emphasis) 

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

## Development
```
$ cd /oncallbot
$ npm run watch
```

## Credits
The robot icon the app uses was made by [Darius Dan](https://www.flaticon.com/authors/darius-dan) from [www.flaticon.com](https://www.flaticon.com/) and is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/). Thank you Darius Dan and FlatIcon!

## License
[MIT](https://choosealicense.com/licenses/mit/)