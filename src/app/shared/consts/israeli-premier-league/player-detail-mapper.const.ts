export const mapPlayerDetails = (inputArray: string[]): string[] => {
    return inputArray
        .map((player: string) => player)
        .filter((lastName: string, index: number, currentVal: string[]): boolean =>
            currentVal.indexOf(lastName) === index
        );
}
