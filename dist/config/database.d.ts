import 'reflect-metadata';
import { DataSource } from 'typeorm';
declare class Database {
    private dataSource;
    connect(): Promise<DataSource>;
    disconnect(): Promise<void>;
    getDataSource(): DataSource | null;
    isConnected(): boolean;
    runMigrations(): Promise<void>;
    revertMigration(): Promise<void>;
}
declare const _default: Database;
export default _default;
