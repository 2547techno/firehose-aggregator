import db from "mariadb";
import { config } from "./config";

class DB {
    pool;

    constructor() {
        this.pool = db.createPool({
            ...config.db,
        });
    }
}

const instance = new DB();

export { instance as db };
