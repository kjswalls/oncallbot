const mongoose = require('mongoose');
const fetch = require('node-fetch');

const Engineer = mongoose.model('Engineer');

const getEngineersAsOptions = async (discipline = null) => {
  // if there's no discipline passed, just get all engineers where discipline is not null
  let disciplineQuery = { discipline } || { $ne: null };
  const engineers = await Engineer.find(disciplineQuery);
  if (!engineers) return [];

  console.log(engineers);
};

const addEngineer = async (slackReq) => {
  const formData = slackReq.submission;
  const engineer = await (new Engineer(formData).save());

  const message = {
    response_type: 'in_channel',
    channel: slackReq.channel_id,
    text: `Engineer *${formData.name}* added :ok_hand:`,
    attachments: [
      {
        text: 'Choose a release to view',
        fallback: 'You are unable to choose a release',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'release_selection',
        actions: [{
          name: 'release_select_menu',
          text: 'Choose a release...',
          type: 'select',
          // options: getReleasesAsOptions(),
        }],
      },
      {
        text: '',
        fallback: 'You are unable to add a release or an engineer',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'add_release_or_engineer',
        actions: [
          {
            name: 'add_release_button',
            text: 'Add a release',
            type: 'button',
            value: 'add_release',
          },
          {
            name: 'add_engineer_button',
            text: 'Add an engineer to the pool',
            type: 'button',
            value: 'add_engineer',
          },
        ],
      }
    ],
  };

  const response = await fetch(slackReq.response_url, {
    method: 'POST',
    body: JSON.stringify(message),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`
    },
  });
  const data = await response.json();
  console.log(data);
};

const handleReleaseSelection = (slackReq) => {
  const release = slackReq.actions[0].selected_options[0].value;
  const engineersOnCall = getEngineersOnCall(release);
  const engineersOnBackup = getEngineersOnBackup(release);
  const text = `
    You chose the ${release} release.\n
    On call: ${engineersOnCall.join(', ')}\n
    Backup: ${engineersOnBackup.join(', ')}
  `;

  const response = {
    response_type: 'in_channel',
    channel: slackReq.channel.id,
    text,
  };

  return response;
};

const renderAddEngineerModal = async (slackReq) => {
  const dialog = {
    trigger_id: slackReq.trigger_id,
    dialog: {
      callback_id: 'add_engineer_form',
      title: 'Add an engineer',
      submit_label: 'Add',
      elements: [
        {
          type: 'text',
          label: 'Name',
          name: 'name',
          placeholder: 'Kate McKinnon',
        },
        {
          type: 'select',
          label: 'Discipline',
          name: 'discipline',
          options: [
            {
              label: 'Front End',
              value: 'front_end',
            },
            {
              label: 'Back End',
              value: 'back_end',
            },
          ],
        },
        {
          type: 'select',
          label: 'Pod',
          name: 'pod',
          options: [
            {
              label: 'Consumer Tools',
              value: 'consumer_tools',
            },
            {
              label: 'Consumer Engagement',
              value: 'consumer_engagement',
            },
          ],
        },
      ],
    },
  };

  const response = await fetch('https://slack.com/api/dialog.open', {
    method: 'POST',
    body: JSON.stringify(dialog),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`
    },
  });

  const data = await response.json();
  return data;
};

const renderAddReleaseModal = async (slackReq) => {
  const engineerOptions = getEngineersAsOptions('back_end');
  const dialog = {
    trigger_id: slackReq.trigger_id,
    dialog: {
      callback_id: 'add_release_form',
      title: 'Add a new release',
      submit_label: 'Add',
      elements: [
        {
          type: 'text',
          label: 'Name',
          name: 'name',
          placeholder: 'e.g. 18.10.1',
        },
        {
          type: 'text',
          label: 'Date',
          name: 'date',
          placeholder: 'M/D',
          max_length: 5,
          hint: 'You can only add a release for the current year',
        },
        {
          type: 'select',
          label: 'Back End Engineer',
          name: 'back_end_primary',
          optional: true,
          // options: getEngineersAsOptions('back_end'),
        },
      ],
    },
  };

  const response = await fetch('https://slack.com/api/dialog.open', {
    method: 'POST',
    body: JSON.stringify(dialog),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`
    },
  });

  const data = await response.json();
  console.log(data);
  return data;
};

exports.handleActions = async (req, res) => {
  const slackReq = JSON.parse(req.body.payload);
  let response = {
    response_type: 'in_channel',
    channel: slackReq.channel.id,
    text: 'Oops, something went wrong',
  };

  if (slackReq.callback_id === 'release_selection') {
    response = handleReleaseSelection(slackReq);
  } else if (slackReq.callback_id === 'add_release_or_engineer') {
    const buttonPressed = slackReq.actions[0].value;
    if (buttonPressed === 'add_engineer') {
      res.send('');
      const data = await renderAddEngineerModal(slackReq);
      return data;
    }

    if (buttonPressed === 'add_release') {
      res.send('');
      const data = await renderAddReleaseModal(slackReq);
      return data;
    }
  } else if (slackReq.callback_id === 'add_engineer_form') {
    res.send('');
    const data = await addEngineer(slackReq);
    return data;
  }

  return res.json(response);
};
