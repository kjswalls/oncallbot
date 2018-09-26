# On Call Bot

- A Slack app for the Consumer Services group at ZapLabs to assign engineers to be "on call" for monolith releases in case anything breaks.

- This app is currently in progress, but once it's finished, I'll flesh out this readme with examples, GIFs, emojis, the works!

- Made with Node.js, Express, Mongoose / MongoDB


## Usage

- This bot will respond to the slash command /oncall in any of the Consumer Services slack channels. It will feature a GUI for adding releases, assigning and removing engineers, and editing those releases in case something is off. It will also accept command text like `/oncall 18.9.1` to view release info, `/oncall -o @kirby.walls` to assign engineers, etc.

- It should also feature logic for assigning engineers to releases automatically, on a rotating schedule.