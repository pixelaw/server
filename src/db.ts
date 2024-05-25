import {Database} from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

import {open} from 'sqlite'
import {QueueItem} from "./QueueHandler";


export class SqliteDb {
    private db: Database;

    constructor(private dbDir: string) {
    }

    async open(): Promise<void> {
        const filename= `${this.dbDir}/server.sqlite`

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
    async getQueueItemPending(timestamp: number): Promise<QueueItem[]> {

        const query = 'SELECT * FROM pending WHERE timestamp <= ?';
        const rows = await this.db.all(query, [timestamp]);

        return rows.map(row => JSON.parse(row.data));
    }

    async movePendingToError(id: string, reason: string): Promise<void> {
// TODO make this a transaction
        const item = await this.db.all(
            'SELECT * FROM pending WHERE id = ?',
            [id]
        );

        await this.db.run(
            'INSERT INTO errors (id, timestamp, data, reason) VALUES (?, ?, ?, ?)',
            [item[0].id, item[0].timestamp, item[0].data, reason]
        );

        await this.db.run(
            'DELETE FROM pending WHERE id = ?',
            [id]
        );
    }

    async removeQueueItemPending(id: string): Promise<void> {
        const deleteQuery = 'DELETE FROM pending WHERE id = ?';
        await this.db.run(deleteQuery, [id]);

    }

    async setQueueItemPending(queueItem: QueueItem): Promise<void> {
        const query = 'INSERT OR REPLACE INTO pending (id, timestamp, data) VALUES (?, ?, ?)';
        await this.db.run(query, [queueItem.id, queueItem.timestamp, JSON.stringify(queueItem)]);
    }

    async setQueueItemError(queueItem: QueueItem, reason: string): Promise<void> {
        const query = 'INSERT INTO errors (id, timestamp, data, reason) VALUES (?, ?, ?, ?)';
        await this.db.run(query, [queueItem.id, queueItem.timestamp, JSON.stringify(queueItem), reason]);
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

    async getSystemNumericValue(name: string): Promise<number> {
        const query = 'SELECT data_number FROM system WHERE name = ?';
        const row = await this.db.get(query, [name]);
        return row ? row.data_number : null;
    }

    async getSystemTextValue(name: string): Promise<string> {
        const query = 'SELECT data_text FROM system WHERE name = ?';
        const row = await this.db.get(query, [name]);
        return row ? row.data_text : null;
    }


    async close(): Promise<void> {
        await this.db.close();
    }
}
