import {Database} from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

import {open} from 'sqlite'


export class SqliteDb {
    private db: Database;

    constructor(private dbFile: string) {
    }

    async open(): Promise<void> {
        const filename= `${this.dbFile}`

        if (!fs.existsSync(filename)) {
            this.db = await open({
                filename,
                driver: sqlite3.Database
            });

            const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
            await this.db.exec(schema);
        } else {
            this.db = await open({
                filename,
                driver: sqlite3.Database
            });
        }
    }

    async setLastBlockNumber(blockNumber: number): Promise<void> {
        const query = 'UPDATE system SET data_number = ? WHERE name = ?';
        await this.db.run(query, [blockNumber, 'last_blocknumber']);
    }


    async getLastBlockNumber(): Promise<number> {
        const query = 'SELECT data_number FROM system WHERE name = ?';
        const row = await this.db.get(query, ['last_blocknumber']);
        if(!row) throw "last_blocknumber does not exist in db"
        return row.data_number;
    }


    async close(): Promise<void> {
        await this.db.close();
    }
}
