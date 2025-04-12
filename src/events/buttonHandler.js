const { EmbedBuilder } = require('discord.js');
const Suggestion = require('../models/suggestion');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        const { customId, message, user } = interaction;

        if (customId !== 'upvote' && customId !== 'downvote') return;

        try {
            const suggestion = await Suggestion.findOne({
                messageId: message.id,
                guildId: interaction.guild.id
            });

            if (!suggestion) {
                return await interaction.reply({
                    content: 'This suggestion could not be found in the database.',
                    flags: 64
                });
            }

            if (suggestion.status !== 'pending') {
                return await interaction.reply({
                    content: `This suggestion has already been ${suggestion.status} and can no longer be voted on.`,
                    flags: 64
                });
            }

            if (suggestion.authorId === user.id) {
                return await interaction.reply({
                    content: 'You cannot vote on your own suggestion.',
                    flags: 64
                });
            }

            const userId = user.id;
            let upvoted = suggestion.upvotes.includes(userId);
            let downvoted = suggestion.downvotes.includes(userId);
            let replyMessage = '';

            if (customId === 'upvote') {
                if (upvoted) {
                    suggestion.upvotes = suggestion.upvotes.filter(id => id !== userId);
                    replyMessage = 'Your upvote has been removed.';
                } else {
                    suggestion.upvotes.push(userId);
                    suggestion.downvotes = suggestion.downvotes.filter(id => id !== userId);
                    replyMessage = 'Your upvote has been added.';
                }
            }

            if (customId === 'downvote') {
                if (downvoted) {
                    suggestion.downvotes = suggestion.downvotes.filter(id => id !== userId);
                    replyMessage = 'Your downvote has been removed.';
                } else {
                    suggestion.downvotes.push(userId);
                    suggestion.upvotes = suggestion.upvotes.filter(id => id !== userId);
                    replyMessage = 'Your downvote has been added.';
                }
            }

            await suggestion.save();

            const originalEmbed = message.embeds[0];
            const embed = new EmbedBuilder()
                .setColor(originalEmbed.color)
                .setTitle(originalEmbed.title)
                .setDescription(originalEmbed.description);


            if (originalEmbed.thumbnail) {
                embed.setThumbnail(originalEmbed.thumbnail.url);
            }

            if (originalEmbed.footer) {
                embed.setFooter(originalEmbed.footer);
            }

            if (originalEmbed.timestamp && originalEmbed.timestamp instanceof Date) {
                embed.setTimestamp(originalEmbed.timestamp);
            }

            if (originalEmbed.fields) {
                for (let i = 0; i < originalEmbed.fields.length; i++) {
                    const field = originalEmbed.fields[i];
                    if (field.name === '👍 Upvotes' || field.name === 'Upvotes') {
                        embed.addFields({ name: '👍 Upvotes', value: `\`${suggestion.upvotes.length}\``, inline: true });
                    } else if (field.name === '👎 Downvotes' || field.name === 'Downvotes') {
                        embed.addFields({ name: '👎 Downvotes', value: `\`${suggestion.downvotes.length}\``, inline: true });
                    } else if (field.name === '🆔 Suggestion ID') {
                        embed.addFields({ name: field.name, value: field.value, inline: field.inline });
                    } else {
                        embed.addFields({ name: field.name, value: field.value, inline: field.inline });
                    }
                }
            }

            await message.edit({ embeds: [embed] });

            await interaction.reply({
                content: replyMessage,
                flags: 64
            });

        } catch (error) {
            console.error('Error handling vote:', error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error processing your vote. Please try again later.',
                    flags: 64
                });
            }
        }
    },
};