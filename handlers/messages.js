exports.selectRelease = (releaseOptions, title) => {
  const message = {
    response_type: 'in_channel',
    text: title,
    attachments: [
      {
        text: 'Choose a release to view or edit',
        fallback: 'You are unable to choose a release',
        color: 'good',
        attachment_type: 'default',
        callback_id: 'release_selection',
        actions: [{
          name: 'release_select_menu',
          text: 'Choose a release...',
          type: 'select',
          options: releaseOptions,
        }],
      },
      {
        text: '',
        fallback: 'You are unable to add a release',
        color: 'good',
        attachment_type: 'default',
        callback_id: 'add_release',
        actions: [
          {
            name: 'add_release_button',
            text: 'Add a release',
            type: 'button',
            value: 'add_release',
          },
        ],
      },
    ],
  };

  return message;
};

exports.displayHistory = (releases, backToRelease, limit, channel, user) => {
  const message = {
    // response_type: 'in_channel',
    text: `Last ${limit} releases before *${backToRelease}*:`,
    channel,
    user,
    attachments: []
  };

  message.attachments = releases.map((release) => {
    const primaryEngineers = release.primaryEngineers.map(engineer => engineer ? engineer.name : null);
    const backupEngineers = release.backupEngineers.map(engineer => engineer ? engineer.name : null);
    const attachment = {
      fallback: `Release ${release.name} and associated engineers`,
      color: 'good',
      pretext: '',
      title: release.name,
      text: `Go-live date: ${new Date(release.date).toLocaleDateString('en-US')}\n`,
      fields: [
          {
              title: 'On call:',
              value: `${primaryEngineers.length ? primaryEngineers.join(', ') : 'None'}\n`,
              "short": false
          },
          {
            title: 'Backup:',
            value: `${backupEngineers.length ? backupEngineers.join(', ') : 'None'}`,
            "short": false
        },
      ],
    };
    return attachment;
  });

  message.attachments.push(
    {
      text: '',
      fallback: 'Unable to close message',
      color: '#E8E8E8',
      attachment_type: 'default',
      callback_id: 'close_ephemeral',
      actions: [
        {
          name: 'close',
          text: 'Close',
          type: 'button',
          value: 'close',
        },
      ],
    },
  );

  return message;
};

exports.deleteEphemeral = () => {
  const message = {
    'response_type': 'ephemeral',
    'text': '',
    'replace_original': true,
    'delete_original': true
  };
  return message;
};

exports.displayRelease = (release, primaryEngineers, backupEngineers, remainingEngineers, title) => {
  const message = {
    response_type: 'in_channel',
    // channel: channelId,
    attachments: [
      {
        fallback: `Release ${release.name} and associated engineers`,
        color: 'good',
        pretext: title,
        title: release.name,
        text: `Go-live date: ${new Date(release.date).toLocaleDateString('en-US')}\n`,
        fields: [
            {
                title: 'On call:',
                value: `${primaryEngineers.length ? primaryEngineers.join(', ') : 'None'}\n`,
                "short": false
            },
            {
              title: 'Backup:',
              value: `${backupEngineers.length ? backupEngineers.join(', ') : 'None'}`,
              "short": false
          },
        ],
      },
      {
        text: '',
        fallback: 'You are unable to add or remove engineers',
        color: '#E8E8E8',
        attachment_type: 'default',
        callback_id: 'assign_or_remove_engineer',
        actions: [],
      },
      {
        text: '',
        fallback: 'You are unable to edit this release or view history',
        color: '#E8E8E8',
        attachment_type: 'default',
        callback_id: 'edit_release_or_view_history',
        actions: [
          {
            name: 'edit_release_button',
            text: 'Edit release info',
            type: 'button',
            value: 'edit_release',
          },
          {
            name: 'release_history_button',
            text: 'Last 3 releases',
            type: 'button',
            value: 'release_history',
          },
        ],
      },
      {
        text: '',
        fallback: 'Unable to go back to release',
        color: '#E8E8E8',
        attachment_type: 'default',
        callback_id: 'back_to_select_or_manage_pool',
        actions: [
          {
            name: 'back_to_select',
            text: 'Back to select',
            type: 'button',
            value: 'back_to_select',
          },
          {
            name: 'manage_pool_button',
            text: 'Manage the engineer pool',
            type: 'button',
            value: 'manage_pool',
          },
        ],
      },
    ]
  };

  // if there are engineers left in the pool, show the 'Assign Engineer' button
  if (remainingEngineers.frontEnd.length || remainingEngineers.backEnd.length) {
    message.attachments[1].actions.push(
      {
        name: 'assign_engineer_button',
        text: 'Assign engineer',
        type: 'button',
        value: 'assign_engineer_to_release',
      },
    );
  }

  // if there are engineers assigned to the release, show the 'Remove Engineer' button
  if (primaryEngineers.length || backupEngineers.length) {
    message.attachments[1].actions.push(
      {
        name: 'remove_engineer_button',
        text: 'Remove engineer',
        type: 'button',
        value: 'remove_engineer_from_release',
      },
    );
  }

  return message;
};

exports.displayPool = (frontEnds, backEnds, backToRelease, title) => {
  const message = {
    response_type: 'in_channel',
    attachments: [
      {
        fallback: `Pool of engineers available for releases`,
        color: 'good',
        pretext: title,
        title: '',
        fields: [
          {
              title: 'Front End:',
              value: `${frontEnds.length ? frontEnds.join(', ') : 'None'}\n`,
              "short": false
          },
          {
            title: 'Back End:',
            value: `${backEnds.length ? backEnds.join(', ') : 'None'}`,
            "short": false
          },
        ],
      },
      {
        text: '',
        fallback: 'You are unable to add or remove engineers',
        color: '#E8E8E8',
        attachment_type: 'default',
        callback_id: 'add_or_remove_engineers_from_pool',
        actions: [
          {
            name: 'add_engineer_to_pool_button',
            text: 'Add an engineer to the pool',
            type: 'button',
            value: 'add_engineer_to_pool',
          },
        ],
      },
      {
        text: '',
        fallback: 'Unable to go back to release',
        color: '#E8E8E8',
        attachment_type: 'default',
        callback_id: 'back_to_release',
        actions: [
          {
            name: backToRelease,
            text: 'Back to release',
            type: 'button',
            value: 'back_to_release',
          },
        ],
      },
    ]
  };

  // if there are engineers in the pool, show the 'Remove Engineer' button
  if (frontEnds.length || backEnds.length) {
    message.attachments[1].actions.push(
      {
        name: 'remove_engineer_from_pool_button',
        text: 'Remove engineer',
        type: 'button',
        value: 'remove_engineer_from_pool',
      },
    );
  }

  return message;
};

exports.addReleaseModal = (triggerId, releaseName = null) => {
  const dialog = {
    trigger_id: triggerId,
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
          placeholder: 'M/D/YY',
          max_length: 8,
          hint: 'The day the release goes live',
        },
      ],
    },
  };

  if (releaseName) {
    dialog.dialog.elements[0].value = releaseName;
  }

  return dialog;
};

exports.editReleaseModal = (triggerId, releaseName, releaseDate, releaseId) => {
  const dialog = {
    trigger_id: triggerId,
    dialog: {
      callback_id: 'edit_release_form',
      title: `Edit ${releaseName}`,
      submit_label: 'Save',
      state: releaseId,
      elements: [
        {
          type: 'text',
          label: 'Name',
          name: 'name',
          value: releaseName,
          placeholder: 'e.g. 18.10.1',
        },
        {
          type: 'text',
          label: 'Date',
          name: 'date',
          placeholder: 'M/D/YY',
          max_length: 8,
          value: releaseDate,
          hint: 'The day the release goes live',
        },
      ],
    },
  };

  return dialog;
};

exports.assignEngineerModal = (triggerId, releaseName, frontEndUnique, backEndUnique) => {
  let optionLabel = 'option_groups';
  let options = [];

  // if there are frontends to display but no backends
  if (frontEndUnique.length && !backEndUnique.length) {
    // options = frontEndUnique;
    options = [
      {
        "label": "Front End",
        "options": frontEndUnique,
      },
    ];
  }

  // if there are backends to display but no frontends
  if (!frontEndUnique.length && backEndUnique.length) {
    // options = backEndUnique;
    options = [
      {
        "label": "Back End",
        "options": backEndUnique,
      },
    ];
  }

  // if there are both frontends and backends to display
  if (frontEndUnique.length && backEndUnique.length) {
    // optionLabel = 'option_groups';
    options = [
      {
        "label": "Front End",
        "options": frontEndUnique,
      },
      {
        "label": "Back End",
        "options": backEndUnique,
      }
    ];
  }

  const dialog = {
    trigger_id: triggerId,
    dialog: {
      callback_id: 'assign_engineer_to_release_form',
      title: `Assign to ${releaseName}`,
      submit_label: 'Assign',
      state: releaseName,
      elements: [
        {
          label: 'Name',
          name: "id",
          type: "select",
          [optionLabel]: options,
        },
        {
          type: 'select',
          label: 'On Call or Backup',
          name: 'primary_or_backup',
          options: [
            {
              label: 'On Call',
              value: 'primary',
            },
            {
              label: 'Backup',
              value: 'backup',
            },
          ],
        },
      ],
    },
  };

  return dialog;
};

exports.addEngineerModal = (triggerId, releaseName) => {
  const dialog = {
    trigger_id: triggerId,
    dialog: {
      callback_id: 'add_engineer_form',
      title: 'Add an engineer',
      submit_label: 'Add',
      state: releaseName,
      elements: [
        {
          label: 'Name',
          name: "slackId",
          type: "select",
          data_source: "users"
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

  return dialog;
};

exports.removeEngineerFromPoolModal = (triggerId, releaseName, frontEnds, backEnds) => {
  let optionLabel = 'option_groups';
  let options = [];

  // if there are frontends to display but no backends
  if (frontEnds.length && !backEnds.length) {
    // options = frontEndUnique;
    options = [
      {
        "label": "Front End",
        "options": frontEnds,
      },
    ];
  }

  // if there are backends to display but no frontends
  if (!frontEnds.length && backEnds.length) {
    // options = backEndUnique;
    options = [
      {
        "label": "Back End",
        "options": backEnds,
      },
    ];
  }

  // if there are both frontends and backends to display
  if (frontEnds.length && backEnds.length) {
    // optionLabel = 'option_groups';
    options = [
      {
        "label": "Front End",
        "options": frontEnds,
      },
      {
        "label": "Back End",
        "options": backEnds,
      }
    ];
  }

  const dialog = {
    trigger_id: triggerId,
    dialog: {
      state: releaseName,
      callback_id: 'remove_engineer_from_pool_form',
      title: `Remove engineer`,
      submit_label: 'Remove',
      elements: [
        {
          label: 'Name',
          name: "id",
          type: "select",
          [optionLabel]: options,
        },
      ],
    },
  };

  return dialog;
};

exports.removeEngineerFromReleaseModal = (triggerId, releaseName, primaryEngineers, backupEngineers) => {
  const dialog = {
    trigger_id: triggerId,
    dialog: {
      callback_id: 'remove_engineer_from_release_form',
      title: `Remove from ${releaseName}`,
      submit_label: 'Remove',
      state: releaseName,
      elements: [],
    },
  };

  if (primaryEngineers.length) {
    dialog.dialog.elements.push({
      label: 'On Call',
      name: "primary",
      type: "select",
      optional: true,
      options: primaryEngineers,
    });
  }
  if (backupEngineers.length) {
    dialog.dialog.elements.push({
      label: 'Backup',
      name: "backup",
      type: "select",
      optional: true,
      options: backupEngineers,
    },);
  }

  return dialog;
};

exports.createReminderError = (reason) => {
  const message = {
    // response_type: 'in_channel',
    text: `There was a problem creating a reminder for the user(s) you assigned. :disappointed: ${reason}`,
  };

  return message;
};

exports.deleteReminderError = (reason) => {
  const message = {
    // response_type: 'in_channel',
    text: `There was a problem deleting a reminder for the user(s) you removed. :disappointed: ${reason}`,
  };

  return message;
};

exports.help = () => {
  const message = {
    response_type: 'in_channel',
    attachments: [
      {
        fallback: `Pool of engineers available for releases`,
        color: '#E8E8E8',
        pretext: 'Hello! :wave: Need some help with `/oncall`?',
        title: '',
        text: 'Use `/oncall` to assign people to releases, edit those assignments, and find out who\'s on call. For example:',
        fields: [
          {
              title: '',
              value: '• `/oncall 18.9.1` to add a release or view an existing release\'s info',
              "short": false
          },
          {
            title: '',
            value: '• `/oncall 18.9.1 -o @willem.jager -b @hai.phan @jonathan.anstett` to assign Willem as on call, Hai and Jonathan as backups',
            "short": false
          },
          {
            title: '',
            value: '• `/oncall 18.9.1 -r @kirby.walls @renee.gallison` to remove people from a release',
            "short": false
          },
          {
            title: '',
            value: '• `/oncall 18.9.1 9/7/18` to quickly add a release',
            "short": false
          },
          {
            title: '',
            value: 'You can also use the `/oncall` command by itself to do all of that via the GUI. \nSelect a release to view from the dropdown, and then use the buttons to edit the release\'s info, assign and remove engineers, view previous releases, and manage the pool of available engineers.',
            "short": false
          },
        ],
      },
      {
        'fallback': 'Check out the readme for this app',
        'actions': [
          {
            'type': 'button',
            'text': 'More info :bulb:',
            'url': 'https://github.com/kjswalls/oncallbot/blob/master/readme.md'
          }
        ]
      }
    ]
  };

  return message;
};