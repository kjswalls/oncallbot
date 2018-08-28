const mongoose = require('mongoose');
const fetch = require('node-fetch');

const Engineer = mongoose.model('Engineer');
const getEngineersAsOptions = async () => {

};

const addEngineer = async (slackReq) => {
  const engineer = await (new Engineer().save());
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

const renderAddEngineerModal = (slackReq) => {
  const response = {
    trigger_id: slackReq.trigger_id,
    dialog: {
      callback_id: 'add_engineer_form',
      title: 'Add an engineer to the pool',
      submit_label: 'Add',
      elements: [
        {
          type: 'text',
          label: 'Name',
          name: 'engineer_name',
          placeholder: 'Kate McKinnon',
        },
        {
          type: 'select',
          label: 'Discipline',
          name: 'engineer_discipline',
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
          name: 'engineer_pod',
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

  return fetch('https://slack.com/api/dialog.open', {
    method: 'POST',
    body: JSON.stringify(response),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${slackReq.token}`
    },
  });

  // return response;
};

const renderAddReleaseModal = (slackReq) => {
  const response = {
    trigger_id: slackReq.trigger_id,
    dialog: {
      callback_id: 'add_release_form',
      title: 'Add a new release',
      submit_label: 'Add',
      elements: [
        {
          type: 'text',
          label: 'Name',
          name: 'release_name',
          placeholder: 'e.g. 18.10.1',
        },
        {
          type: 'text',
          label: 'Date',
          name: 'release_date',
          placeholder: 'M/D',
          max_length: 5,
          hint: 'You can only add a release for the current year',
        },
        {
          type: 'select',
          label: 'Back End Engineer',
          name: 'back_end_primary',
          optional: true,
          option_groups: getEngineersAsOptions(),
        },
      ],
    },
  };

  return response;
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
      return renderAddEngineerModal(slackReq);
    }

    if (buttonPressed === 'add_release') {
      response = renderAddReleaseModal(slackReq);
    }
  } else if (slackReq.callback_id === 'add_engineer_form') {
    response = addEngineer(slackReq);
  }

  return res.json(response);
};
