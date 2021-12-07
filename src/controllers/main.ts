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

    static createBaseTables(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const query = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG='${config.database}'`;
                const result = await sql.query(query);
                let userFlag = 1;
                let logFlag = 1;
                result.recordset.map((item: any) => {
                    if (item.TABLE_NAME === 'users') userFlag = 0;
                    if (item.TABLE_NAME === 'logs') logFlag = 0;
                });
                if (userFlag) {
                    const query = 'CREATE TABLE users(\
                        id INT NOT NULL IDENTITY (1, 1),\
                        username VARCHAR(50) NOT NULL,\
                        email VARCHAR(50) NOT NULL,\
                        password VARCHAR(255) NOT NULL,\
                        role INT NOT NULL,\
                        PRIMARY KEY (id)\
                    )';
                    await sql.query(query);
                    bcrypt.genSalt(saltRound, (err: any, salt: any) => {
                        bcrypt.hash('admin', salt, (err: any, hash: any) => {
                            const query = `INSERT INTO users (username, email, password, role) VALUES ('admin', 'admin@gmail.com', '${hash}', '1')`;
                            sql.query(query);
                        });
                    });
                }
                if (logFlag) {
                    const query = 'CREATE TABLE logs(\
                        id INT NOT NULL IDENTITY (1, 1),\
                        username VARCHAR(50) NOT NULL,\
                        tablename VARCHAR(50) NOT NULL,\
                        action VARCHAR(10) NOT NULL,\
                        oldContent TEXT NOT NULL,\
                        newContent TEXT NOT NULL,\
                        logTime TEXT NOT NULL,\
                        PRIMARY KEY (id)\
                    )';
                    await sql.query(query);
                }
                res.status(200).json({ message: "success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static login(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
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
                            res.status(200).json({ message: "Log In Error", description: 'Username or password is incrrect.' });
                        }
                    });
                } else {
                    res.status(200).json({ message: "Log In Error", description: 'Username or password is incrrect.' });
                }
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static signup(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const query = `SELECT * FROM users WHERE username='${req.body.fullname}' OR email='${req.body.email}'`;
                const user = await sql.query(query);
                if (user.recordset.length) {
                    res.status(200).json({ message: "Sign Up Error", description: "Same name or email is already exist.", data: null });
                } else {
                    bcrypt.genSalt(saltRound, (err: any, salt: any) => {
                        bcrypt.hash(req.body.createpassword, salt, (err: any, hash: any) => {
                            const query = `INSERT INTO users (username, email, password, role) VALUES ('${req.body.fullname}', '${req.body.email}', '${hash}', 2)`;
                            sql.query(query);
                            res.status(200).json({ message: "Sign Up Success", description: "Your credential has been registered successfully." });
                        });
                    });
                }
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static changePassword(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
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
                                    res.status(200).json({ message: "Change Success", description: "Your password has been changed successfully." });
                                });
                            });
                        } else {
                            res.status(200).json({ message: "Change Error", description: "Old password is incorrect." });
                        }
                    });
                } else {
                    res.status(200).json({ message: "Change Error", description: 'Your credintial is not exist.' });
                }
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static getUsers(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const query = 'SELECT * FROM users ORDER BY id DESC';
                const result = await sql.query(query);
                res.status(200).json({ message: "success", data: result.recordset.filter((item: any) => (item.role === 2)) });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static deleteUser(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const query = `DELETE FROM users WHERE id=${req.body.id}`;
                await sql.query(query);
                res.status(200).json({ message: "success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static viewLog(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const query = 'SELECT * FROM logs ORDER BY id DESC';
                const result = await sql.query(query);
                res.status(200).json({ message: "success", data: result.recordset });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static getTables(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const query = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG='${config.database}'`;
                const result = await sql.query(query);
                res.status(200).json({ message: "success", data: result.recordset.filter((item: any) => (item.TABLE_NAME != 'users' && item.TABLE_NAME != 'logs')) });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static getContent(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const query = `USE ${config.database} SELECT *  FROM INFORMATION_SCHEMA.COLUMNS  WHERE TABLE_NAME = '${req.body.table}' AND COLUMN_NAME = 'id'`;
                const result = await sql.query(query);
                if (!result.recordset.length) {
                    const query = `alter table ${req.body.table} add id int identity(1,1)`;
                    await sql.query(query);
                }
                const contentQuery = `SELECT * FROM ${req.body.table} ORDER BY id DESC`;
                const contentData = await sql.query(contentQuery);
                res.status(200).json({ message: "success", data: contentData.recordset });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static createRow(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
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
                let newContent: any = [];
                for (const key in req.body.data) {
                    if (flag2) {
                        query += ', ';
                    }
                    else {
                        flag2 = 1;
                    }
                    query += `'${req.body.data[key]}'`;
                    newContent = [...newContent, req.body.data[key]];
                }
                query += `)`;
                await sql.query(query);
                const estTime = convertToServerTimeZone();
                const logQuery = `INSERT INTO logs (username, tablename, action, oldContent, newContent, logTime) VALUES ('${req.body.user}', '${req.body.table}', 'create', '', '${JSON.stringify(newContent)}', '${estTime}')`;
                await sql.query(logQuery);
                res.status(200).json({ message: "success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static updateRow(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const baseQuery = `SELECT * FROM ${req.body.table} WHERE id=${req.body.id}`;
                const baseData = await sql.query(baseQuery);
                let oldContent: any = [];
                for (const key in baseData.recordset[0]) {
                    if (key !== 'id') {
                        oldContent = [...oldContent, baseData.recordset[0][key]];
                    }
                }
                let query = `UPDATE ${req.body.table} SET`;
                let flag = 0;
                let newContent: any = [];
                for (const key in req.body.data) {
                    if (flag) {
                        query += ',';
                    }
                    else {
                        flag = 1;
                    }
                    query += ` ${key}='${req.body.data[key]}'`;
                    newContent = [...newContent, req.body.data[key]];
                }
                query += ` WHERE id=${req.body.id}`;
                await sql.query(query);
                const estTime = convertToServerTimeZone();
                const logQuery = `INSERT INTO logs (username, tablename, action, oldContent, newContent, logTime) VALUES ('${req.body.user}', '${req.body.table}', 'update', '${JSON.stringify(oldContent)}', '${JSON.stringify(newContent)}', '${estTime}')`;
                await sql.query(logQuery);
                res.status(200).json({ message: "success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }

    static deleteRow(req: any, res: any) {
        (async function () {
            try {
                await sql.connect(config);
                const baseQuery = `SELECT * FROM ${req.body.table} WHERE id=${req.body.id}`;
                const baseData = await sql.query(baseQuery);
                let oldContent: any = [];
                for (const key in baseData.recordset[0]) {
                    if (key !== 'id') {
                        oldContent = [...oldContent, baseData.recordset[0][key]];
                    }
                }
                const query = `DELETE FROM ${req.body.table} WHERE id=${req.body.id}`;
                await sql.query(query);
                const estTime = convertToServerTimeZone();
                const logQuery = `INSERT INTO logs (username, tablename, action, oldContent, newContent, logTime) VALUES ('${req.body.user}', '${req.body.table}', 'delete', '${JSON.stringify(oldContent)}', '', '${estTime}')`;
                await sql.query(logQuery);
                res.status(200).json({ message: "success" });
            } catch (err) {
                console.log(err);
            }
        })()
    }
}

export default MainController;
