export function removeDiacritics(str) {
    if (!str) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

export function searchMatch(query, text) {
    if (!query) return true;
    if (!text) return false;
    return removeDiacritics(text).includes(removeDiacritics(query));
}
