import 'reflect-metadata';
import express from 'express';
import { Server } from 'socket.io';
declare class App {
    app: express.Application;
    server: any;
    io: Server;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeSocketIO;
    private initializeErrorHandling;
    private setupSwagger;
    private setupFrontendRoutes;
    start(): Promise<void>;
    private gracefulShutdown;
}
declare const app: App;
export default app;
