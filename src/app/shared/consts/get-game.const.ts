export const getGameConst = (url: string) => {
    return url
        .substring(1)
        .replace(/-([a-z])/g, (k) => k[1].toUpperCase());
}
