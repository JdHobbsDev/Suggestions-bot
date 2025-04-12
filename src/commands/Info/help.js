const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { categories } = require('../../config/categories');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Learn how to use the suggestion system'),

    async execute(interaction, client) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('📝 Suggestion System Help')
            .setDescription('Welcome to the Suggestion System! Here\'s how to use it:')
            .addFields(
                {
                    name: '📋 Creating a Suggestion',
                    value: '`/suggest` - Start the suggestion process and follow the prompts to select a category and submit your idea.'
                },
                {
                    name: '🗂️ Available Categories',
                    value: categories.map(cat => `• **${cat.name}**: ${cat.description}`).join('\n')
                },
                {
                    name: '👍 Voting on Suggestions',
                    value: 'Use the upvote and downvote buttons on suggestion posts to show your support or disagreement.'
                },
                {
                    name: '🔍 Finding Your Suggestion',
                    value: 'Each suggestion has a unique 6-digit ID displayed in the footer and in the suggestion embed. Moderators use this ID when accepting or denying suggestions.'
                }
            )
            .setFooter({
                text: 'Use /suggest to create a suggestion',
                iconURL: client.user.displayAvatarURL()
            });

        await interaction.reply({
            embeds: [helpEmbed]
        });
    }
};