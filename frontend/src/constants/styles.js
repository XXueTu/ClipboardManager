/**
 * 样式相关常量
 */

export const CONTENT_MAX_LENGTH = 150;

export const SEARCH_ANIMATION_STYLE = `
@keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}

.search-container:hover {
    transform: translateY(-1px);
}

.filter-option:hover {
    background-color: rgba(24,144,255,0.08);
}

.content-clickable {
    cursor: pointer;
    transition: all 0.2s ease;
}

.content-clickable:hover {
    background-color: rgba(24,144,255,0.04);
    border-radius: 4px;
}
`;

export const MONITORING_STATUS_STYLE = {
    position: 'absolute',
    top: 16,
    right: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#52c41a',
    fontSize: '12px',
    background: 'rgba(82, 196, 26, 0.1)',
    padding: '4px 8px',
    borderRadius: '12px',
    border: '1px solid rgba(82, 196, 26, 0.3)',
    zIndex: 10
};

export const PULSE_DOT_STYLE = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#52c41a',
    animation: 'pulse 2s infinite'
};