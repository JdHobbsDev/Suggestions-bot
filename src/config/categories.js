module.exports = {
    categories: [
        {
            id: 'feature',
            name: 'Feature Request',
            channelId: '', // Add your channel ID for feature requests (You can leave blank and just have the default channel if you want)
            description: 'Suggest new features for the server'
        },
        {
            id: 'improvement',
            name: 'Improvement',
            channelId: '', // Add your channel ID for improvements (You can leave blank and just have the default channel if you want)
            description: 'Suggest improvements to existing features'
        },
        {
            id: 'event',
            name: 'Event Idea',
            channelId: '', // Add your channel ID for event ideas (You can leave blank and just have the default channel if you want)
            description: 'Suggest ideas for server events'
        },
        {
            id: 'other',
            name: 'Other',
            channelId: '', // Add your channel ID for other suggestions (You can leave blank and just have the default channel if you want)
            description: 'Other suggestions that don\'t fit the categories above'
        }
    ],

    // Default channel if category channel is not set
    defaultSuggestionChannel: '',

    // Roles that can accept/deny suggestions
    moderatorRoles: [''] // role IDs that can manage suggestions (remember to seperate with commas)
};