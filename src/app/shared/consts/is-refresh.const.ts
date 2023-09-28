export const refreshAfter1Hour = () => {
    const time: string | null = localStorage.getItem('chosenWordTimestamp');
    const now: number = Math.floor(Date.now() / 1000);
    if (time && (now - 3600) > +time ) {
        localStorage.clear();
    }
};
