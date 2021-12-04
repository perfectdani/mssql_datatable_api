import { config } from "../config";
const sql = require("mssql/msnodesqlv8");
const bcrypt = require("bcrypt");
const saltRound = 10;

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
                const query = `SELECT * FROM users WHERE fullname='${req.body.username}'`;
                const user = await sql.query(query);
                if (user.recordset.length) {
                    const hash = user.recordset[0].password;
                    bcrypt.compare(req.body.password, hash, function (err: any, match: any) {
                        if (match) {
                            res.status(200).json({ message: "Log In Success", description: "You was logined successfully." });
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
                const query = `SELECT * FROM users WHERE fullname='${req.body.fullname}' OR email='${req.body.email}'`;
                const user = await sql.query(query);
                if (user.recordset.length) {
                    res.status(200).json({ message: "Sign Up Error", description: "Same name or email is exist already.", data: null });
                } else {
                    let password: any;
                    bcrypt.genSalt(saltRound, (err: any, salt: any) => {
                        bcrypt.hash(req.body.createpassword, salt, (err: any, hash: any) => {
                            password = hash;
                            const query = `INSERT INTO users (fullname, email, password) VALUES ('${req.body.fullname}', '${req.body.email}', '${password}')`;
                            sql.query(query);
                            res.status(200).json({ message: "Sign Up Success", description: "Your info was registered successfully." });
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
                res.status(200).json({ message: "Success", data: result.recordset.filter((item: any) => (item.TABLE_NAME != 'users' && item.TABLE_NAME != 'log')) });
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
