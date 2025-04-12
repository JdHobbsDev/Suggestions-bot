const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const statusArray = [
    "/suggest",
    "/help"
];

const { ActivityType } = require('discord.js');
module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('Suggestion bot is now online.');
        async function pickPresence() {
            const option = Math.floor(Math.random() * statusArray.length);
            const status = typeof statusArray[option] === 'function' ? statusArray[option](client) : statusArray[option];

            try {
                await client.user.setPresence({
                    activities: [
                        {
                            name: status,
                            type: 4,
                        },
                    ],
                    status: 'dnd',
                });
            } catch (error) {
                console.error('Error setting custom status:', error);
            }
        }
        setInterval(pickPresence, 10000);
    },
};
