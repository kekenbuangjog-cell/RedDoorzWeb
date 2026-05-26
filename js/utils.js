const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => escapeMap[char]);
}

export function peso(value) {
    return `PHP ${Number(value || 0).toLocaleString()}`;
}

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function dateDiffNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}
