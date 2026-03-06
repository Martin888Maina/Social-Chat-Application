// consistent date/time display across all chat components
export const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
        date: date.toLocaleDateString('en-US'),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }),
    };
};
