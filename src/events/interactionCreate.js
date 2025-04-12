
module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`Command not found: ${interaction.commandName}`);
            return;
        }

        try {

            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);

            let errorMessage = 'There was an error while executing this command!';

            if (error.code) {
                switch (error.code) {
                    case 50001:
                        errorMessage = 'The bot lacks permissions to perform this action. Please check the bot\'s permissions.';
                        break;
                    case 50013:
                        errorMessage = 'The bot doesn\'t have permission to perform this action in this channel.';
                        break;
                    case 50007:
                        errorMessage = 'Cannot send messages to this user. They might have DMs disabled.';
                        break;
                    case 10062:
                        errorMessage = 'This interaction has expired.';
                        break;
                    case 50035:
                        errorMessage = 'Invalid form body or invalid data was provided.';
                        break;
                }
            }

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: errorMessage,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: errorMessage,
                        ephemeral: true
                    });
                }
            } catch (followUpError) {
                console.error('Failed to send error message:', followUpError);
            }
        }
    },
};

