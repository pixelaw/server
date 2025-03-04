export default class ToriiSql {
    toriiUrl: string
    constructor(toriiUrl: string) {
        this.toriiUrl = toriiUrl
    }

    async getNewScheduled(lastRowId: number) {
        const query = `SELECT ROWID, id, timestamp, called_system, selector, calldata 
                        FROM "pixelaw-QueueScheduled"
                        WHERE ROWID > ${lastRowId}`

        return await this.call(query)
    }

    async getNewProcessed(lastRowId: number) {
        const query = `SELECT ROWID, id, result 
                        FROM "pixelaw-QueueProcessed"
                        WHERE ROWID > ${lastRowId}`

        return await this.call(query)
    }

    async call(query) {
        const response = await fetch(`${this.toriiUrl}/sql?query=${query}`)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const json = await response.json()
        return json
    }
}
