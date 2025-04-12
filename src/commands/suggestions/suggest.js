const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { categories } = require('../../config/categories');
const Suggestion = require('../../models/suggestion');

function generateSuggestionId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Create a new suggestion'),

    async execute(interaction, client) {
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('category-select')
                    .setPlaceholder('Select a category for your suggestion')
                    .addOptions(categories.map(category => ({
                        label: category.name,
                        value: category.id,
                        description: category.description
                    })))
            );

        await interaction.reply({
            content: 'Please select a category for your suggestion:',
            components: [row],
            flags: 64
        });

        const filter = i => i.customId === 'category-select' && i.user.id === interaction.user.id;

        try {
            const categorySelection = await interaction.channel.awaitMessageComponent({
                filter,
                time: 120000
            }).catch(error => {
                if (error.code === 'InteractionCollectorError') {
                    interaction.followUp({
                        content: 'You took too long to select a category. Please try again with the `/suggest` command.',
                        flags: 64
                    });
                } else {
                    console.error('Error in category selection:', error);
                    interaction.followUp({
                        content: 'An error occurred while processing your selection. Please try again.',
                        flags: 64
                    });
                }
                throw error;
            });

            const selectedCategory = categorySelection.values[0];
            const categoryData = categories.find(cat => cat.id === selectedCategory);

            const modal = new ModalBuilder()
                .setCustomId(`suggestion-modal-${selectedCategory}`)
                .setTitle(`New ${categoryData.name} Suggestion`);

            const suggestionInput = new TextInputBuilder()
                .setCustomId('suggestion-input')
                .setLabel('What would you like to suggest?')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Describe your suggestion in detail...')
                .setRequired(true)
                .setMaxLength(1000);

            const firstActionRow = new ActionRowBuilder().addComponents(suggestionInput);
            modal.addComponents(firstActionRow);

            await categorySelection.showModal(modal);

            const modalSubmit = await interaction.awaitModalSubmit({
                filter: i => i.customId === `suggestion-modal-${selectedCategory}` && i.user.id === interaction.user.id,
                time: 300000
            }).catch(error => {
                if (error.code === 'InteractionCollectorError') {
                    categorySelection.followUp({
                        content: 'You took too long to submit your suggestion. Please try again with the `/suggest` command.',
                        flags: 64
                    }).catch(e => console.error('Could not send timeout message:', e));
                } else {
                    console.error('Error in modal submission:', error);
                    categorySelection.followUp({
                        content: 'An error occurred while processing your suggestion. Please try again.',
                        flags: 64
                    }).catch(e => console.error('Could not send error message:', e));
                }
                return null;
            });

            if (!modalSubmit) {
                return await interaction.followUp({
                    content: 'Suggestion creation timed out.',
                    flags: 64
                });
            }

            const suggestionContent = modalSubmit.fields.getTextInputValue('suggestion-input');
            const targetChannelId = categoryData.channelId || require('../../config/categories').defaultSuggestionChannel;
            const targetChannel = await client.channels.fetch(targetChannelId).catch(() => null);

            if (!targetChannel) {
                return await modalSubmit.reply({
                    content: 'Error: Could not find the suggestion channel. Please contact an administrator.',
                    flags: 64
                });
            }


            const suggestionId = generateSuggestionId();

            const suggestionEmbed = new EmbedBuilder()
                .setColor(0x3498db)
                .setTitle(`📝 ${categoryData.name} Suggestion`)
                .setDescription(`>>> ${suggestionContent}`)
                .addFields(
                    { name: '📊 Status', value: '`Pending`', inline: true },
                    { name: '👍 Upvotes', value: '`0`', inline: true },
                    { name: '👎 Downvotes', value: '`0`', inline: true },
                    { name: '🆔 Suggestion ID', value: `\`${suggestionId}\``, inline: false }
                )
                .setFooter({
                    text: `ID: ${suggestionId} • By ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setThumbnail(interaction.user.displayAvatarURL());

            const voteRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('upvote')
                        .setLabel('👍 Upvote')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('downvote')
                        .setLabel('👎 Downvote')
                        .setStyle(ButtonStyle.Danger)
                );

            const suggestionMessage = await targetChannel.send({
                embeds: [suggestionEmbed],
                components: [voteRow]
            });

            await Suggestion.create({
                guildId: interaction.guild.id,
                channelId: targetChannel.id,
                messageId: suggestionMessage.id,
                authorId: interaction.user.id,
                content: suggestionContent,
                category: selectedCategory,
                suggestionId: suggestionId,
                upvotes: [],
                downvotes: []
            });

            await modalSubmit.reply({
                content: `Your suggestion has been submitted! You can view it in <#${targetChannel.id}>`,
                flags: 64
            });

        } catch (error) {
            if (error.code !== 'InteractionCollectorError') {
                console.error('Error in suggestion command:', error);
            }
            return;
        }
    }
};