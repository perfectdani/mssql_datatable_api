import { config } from "../config";
const sql = require("mssql/msnodesqlv8");
const bcrypt = require("bcrypt");
const saltRound = 10;
const offset = -5.0

function convertToServerTimeZone() {
    //EST
    const clientDate = new Date();
    const utc = clientDate.getTime() + (clientDate.getTimezoneOffset() * 60000);
    const serverDate = new Date(utc + (3600000 * offset));
    return serverDate.toLocaleString();
}

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

    static login(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = `SELECT * FROM users WHERE username='${req.body.username}'`;
                const user = await sql.query(query);
                if (user.recordset.length) {
                    const admin = user.recordset[0].role == 1 ? true : false;
                    const hash = user.recordset[0].password;
                    bcrypt.compare(req.body.password, hash, function (err: any, match: any) {
                        if (match) {
                            res.status(200).json({ message: "Log In Success", description: "You are logged in successfully.", admin });
                        }
                        else {
                            res.status(200).json({ message: "Log In Error", description: "Your passowrd is incorrect." });
                        }
                    });
                } else {
                    res.status(200).json({ message: "Log In Error", description: 'Not found your name.' });
                }
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static signup(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = `SELECT * FROM users WHERE username='${req.body.fullname}' OR email='${req.body.email}'`;
                const user = await sql.query(query);
                if (user.recordset.length) {
                    res.status(200).json({ message: "Sign Up Error", description: "Same name or email is already exist.", data: null });
                } else {
                    bcrypt.genSalt(saltRound, (err: any, salt: any) => {
                        bcrypt.hash(req.body.createpassword, salt, (err: any, hash: any) => {
                            const query = `INSERT INTO users (username, email, password, role) VALUES ('${req.body.fullname}', '${req.body.email}', '${hash}', 2)`;
                            sql.query(query);
                            res.status(200).json({ message: "Sign Up Success", description: "Your credential is registered successfully." });
                        });
                    });
                }
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static getTables(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG='${config.database}'`;
                const result = await sql.query(query);
                res.status(200).json({ message: "Success", data: result.recordset.filter((item: any) => (item.TABLE_NAME != 'users' && item.TABLE_NAME != 'logs')) });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static getContent(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = `SELECT * FROM ${req.body.table} ORDER BY Id DESC`;
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
                let query = `INSERT INTO ${req.body.table} (`;
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
                query += ') VALUES (';
                let flag2 = 0;
                let logContent: any = [];
                for (const key in req.body.data) {
                    if (flag2) {
                        query += ', ';
                    }
                    else {
                        flag2 = 1;
                    }
                    query += `'${req.body.data[key]}'`;
                    logContent = [...logContent, req.body.data[key]];
                }
                query += `)`;
                await sql.query(query);
                const estTime = convertToServerTimeZone();
                const logQuery = `INSERT INTO logs (username, tablename, action, logContent, updateContent, logTime) VALUES ('${req.body.user}', '${req.body.table}', 'create', '${JSON.stringify(logContent)}', '', '${estTime}')`;
                await sql.query(logQuery);
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
                const baseQuery = `SELECT * FROM ${req.body.table} WHERE Id=${req.body.editId}`;
                const baseData = await sql.query(baseQuery);
                let logContent: any = [];
                for (const key in baseData.recordset[0]) {
                    if (key !== 'Id') {
                        logContent = [...logContent, baseData.recordset[0][key]];
                    }
                }
                let query = `UPDATE ${req.body.table} SET`;
                let flag = 0;
                let updateContent: any = [];
                for (const key in req.body.data) {
                    if (flag) {
                        query += ',';
                    }
                    else {
                        flag = 1;
                    }
                    query += ` ${key}='${req.body.data[key]}'`;
                    updateContent = [...updateContent, req.body.data[key]];
                }
                query += ` WHERE Id=${req.body.editId}`;
                await sql.query(query);
                const estTime = convertToServerTimeZone();
                const logQuery = `INSERT INTO logs (username, tablename, action, logContent, updateContent, logTime) VALUES ('${req.body.user}', '${req.body.table}', 'update', '${JSON.stringify(logContent)}', '${JSON.stringify(updateContent)}', '${estTime}')`;
                await sql.query(logQuery);
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
                const baseQuery = `SELECT * FROM ${req.body.table} WHERE Id=${req.body.id}`;
                const baseData = await sql.query(baseQuery);
                let logContent: any = [];
                for (const key in baseData.recordset[0]) {
                    if (key !== 'Id') {
                        logContent = [...logContent, baseData.recordset[0][key]];
                    }
                }
                let query = `DELETE FROM ${req.body.table} WHERE Id=${req.body.id}`;
                await sql.query(query);
                const estTime = convertToServerTimeZone();
                const logQuery = `INSERT INTO logs (username, tablename, action, logContent, updateContent, logTime) VALUES ('${req.body.user}', '${req.body.table}', 'delete', '${JSON.stringify(logContent)}', '', '${estTime}')`;
                await sql.query(logQuery);
                res.status(200).json({ message: "Success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static getLogs(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = 'SELECT * FROM logs ORDER BY id DESC';
                const result = await sql.query(query);
                res.status(200).json({ message: "Success", data: result.recordset });
            } catch (err) {
                console.log(err);
            }
        })()
    }
    static changePassword(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config)
                const query = `SELECT * FROM users WHERE username='${req.body.user}'`;
                const user = await sql.query(query);
                if (user.recordset.length) {
                    const hash = user.recordset[0].password;
                    bcrypt.compare(req.body.oldPassword, hash, function (err: any, match: any) {
                        if (match) {
                            bcrypt.genSalt(saltRound, (err: any, salt: any) => {
                                bcrypt.hash(req.body.newPassword, salt, (err: any, newHash: any) => {
                                    const changeQuery = `UPDATE users SET password='${newHash}' WHERE username='${req.body.user}'`;
                                    sql.query(changeQuery);
                                    res.status(200).json({ message: "Change Success", description: "Your password changed successfully." });
                                });
                            });
                        } else {
                            res.status(200).json({ message: "Change Password Error", description: "Please input your old passowrd correctly." });
                        }
                    });
                } else {
                    res.status(200).json({ message: "Change Error", description: 'Not found your credintial.' });
                }
            } catch (err) {
                console.log(err);
            }
        })()
    }
}

export default MainController;
