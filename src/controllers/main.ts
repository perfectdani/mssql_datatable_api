import { config } from '../config';
const sql = require("mssql/msnodesqlv8");

/**
 * @description a dummy class to showcase how controllers should structured
 * @class Main
 */
class MainController {
    /**
     * @author Whomever
     * @param {any} req
     * @param {object} res
     * @returns {Object} Returns an object
     */
    static home(req: any, res: any) {
        res.status(200).json({ message: "Hey! You made it." });
    }
    static getTables(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG='test'";
                const result = await sql.query(query);
                res.status(200).json({ message: "Success", data: result.recordset });
            } catch (err) {
                console.log(err);
            }
        })()
    }
    
    static getContent(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = `select * from ${req.body.table} order by Id desc`;
                const result = await sql.query(query);
                res.status(200).json({ message: "Success", data: result.recordset });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static createRow(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                let query = `insert into ${req.body.table} (`;
                let flag1 = 0;
                for (const key in req.body.data) {
                    if (flag1) {
                        query += ', ';
                    }
                    else {
                        flag1 = 1;
                    }
                    query += `${key}`;
                }
                query += ') values (';
                let flag2 = 0;
                for (const key in req.body.data) {
                    if (flag2) {
                        query += ', ';
                    }
                    else {
                        flag2 = 1;
                    }
                    query += `'${req.body.data[key]}'`;
                }
                query += `)`;
                await sql.query(query);
                res.status(200).json({ message: "Success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static updateRow(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                let query = `update ${req.body.table} set`;
                let flag = 0;
                for (const key in req.body.data) {
                    if (flag) {
                        query += ',';
                    }
                    else {
                        flag = 1;
                    }
                    query += ` ${key}='${req.body.data[key]}'`;
                }
                query += ` where Id=${req.body.editId}`;
                await sql.query(query);
                res.status(200).json({ message: "Success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static deleteRow(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                let query = `delete from ${req.body.table} where Id=${req.body.id}`;
                await sql.query(query);
                res.status(200).json({ message: "Success" }); 
            } catch (err) {
                console.log(err);
            }
        })()
    }
}

export default MainController; 
