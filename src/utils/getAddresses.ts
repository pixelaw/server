export const getCoreActionsAddresses = async (toriiUrl: string) => {
    const query = `SELECT value FROM "pixelaw-CoreActionsAddress"`

    const response = await fetch(`${toriiUrl}/sql?query=${query}`)
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const json = await response.json()
    const coreAddress = json[0].value

    if (!coreAddress) throw new Error("coreAddress has not been initialized")
    return { coreAddress }
}
