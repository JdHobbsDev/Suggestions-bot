const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder } = require('discord.js');
const Suggestion = require('../../models/suggestion');
const { moderatorRoles } = require('../../config/categories');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deny-suggestion')
        .setDescription('Deny a suggestion')
        .addStringOption(option =>
            option.setName('suggestion-id')
                .setDescription('The 6-digit ID of the suggestion to deny')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for denying the suggestion')
                .setRequired(true)),
    async execute(interaction, client) {

        const member = interaction.member;
        const hasPermission = member.permissions.has(PermissionFlagsBits.ManageGuild) || member.roles.cache.some(role => moderatorRoles.includes(role.id));

        if (!hasPermission) {
            return await interaction.reply({
                content: 'You do not have permission to deny suggestions.',
                flags: 64
            });
        }

        const suggestionId = interaction.options.getString('suggestion-id');
        const reason = interaction.options.getString('reason');

        try {
            const suggestion = await Suggestion.findOne({
                suggestionId: suggestionId,
                guildId: interaction.guild.id
            });

            if (!suggestion) {
                return await interaction.reply({
                    content: 'Suggestion not found. Please check the ID and try again.',
                    flags: 64
                })
            }

            if (suggestion.status !== 'pending') {
                return await interaction.reply({
                    content: `This suggestion has already been ${suggestion.status}.`,
                    flags: 64
                });
            }

            suggestion.status = 'denied';
            suggestion.updatedAt = new Date();
            suggestion.moderatorId = interaction.user.id;
            await suggestion.save();

            const channel = await client.channels.fetch(suggestion.channelId);
            const message = await channel.messages.fetch(suggestion.messageId);

            if (!message) {
                return await interaction.reply({
                    content: 'Could not find the suggestion message. It may have been deleted.',
                    flags: 64
                });
            }

            const embed = EmbedBuilder.from(message.embeds[0])
                .setColor(0xe74c3c)
                .spliceFields(0, 1, { name: '📊 Status', value: '`Denied ❌`', inline: true })
                .addFields({
                    name: `❌ Deny Reason (by ${interaction.user.tag})`,
                    value: `>>> ${reason}`
                });

            const originalComponents = message.components;
            const disabledComponents = originalComponents.map(row => {
                const newRow = ActionRowBuilder.from(row);
                newRow.components.forEach(component => {
                    component.setDisabled(true);
                });
                return newRow;
            });

            await message.edit({
                embeds: [embed],
                components: disabledComponents
            });

            try {
                const suggestionAuthor = await client.users.fetch(suggestion.authorId);

                const dmEmbed = new EmbedBuilder()
                    .setColor(0xe74c3c)
                    .setTitle('Your Suggestion Was Denied')
                    .setDescription(`Your suggestion has been denied by a moderator.`)
                    .addFields(
                        { name: 'Suggestion', value: suggestion.content },
                        { name: 'Denied By', value: interaction.user.tag },
                        { name: 'Reason', value: reason }
                    )
                    .setFooter({ text: `ID: ${suggestionId}` });

                await suggestionAuthor.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not DM user ${suggestion.authorId}: ${dmError}`);
            }

            await interaction.reply({
                content: `Suggestion ${suggestionId} has been denied.`,
                flags: 64
            });
        } catch (error) {
            console.error('Error in /deny-suggestion command:', error);
            await interaction.reply({
                content: 'There was an error denying the suggestion. Please try again later.',
                flags: 64
            });
        }
    }
};