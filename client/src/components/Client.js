import React from 'react';
import Avatar from 'react-avatar'; // Assuming you are using react-avatar or custom circles

function Client({ username }) {
    return (
        <div style={styles.clientContainer}>
            {/* Reduced size from 40px to 32px */}
            <Avatar name={username} size="32" round="14px" style={styles.avatar} />
            <span style={styles.usernameText}>{username}</span>
        </div>
    );
}

const styles = {
    clientContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '4px 0', // Tightened vertical gap
    },
    usernameText: {
        fontSize: '13px', // Slightly lower than default body text for better hierarchy
        fontWeight: '500',
        color: '#e5e7eb',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    }
};

export default Client;