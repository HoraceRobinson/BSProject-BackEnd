const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3000
const mysql = require("mysql");
const {request} = require("express");
const fs = require("fs")

const projRoute = require('./project')

var db=mysql.createConnection({host: "localhost",
    port: "3306",
    user: "root",
    password: "zbh11600",
    database: "bstest"});

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
});

app.use('/project', projRoute)

app.use(bodyParser.json({limit: '50mb'}))
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({limit: '50mb', extended: false }));


//登录信息验证
app.post("/login", async function(req,res){
    let str = "select * from user ";
    str += "where username = \"" + req.query.username + "\" and password = \"" + req.query.password +"\";";
    await db.query(str, function (err, data){
        if(err){
            console.log(err);
        }
        res.send(data);
    })
})

//注册信息验证
app.post("/register", function(req, res){
    let str = "select * from user where username = ";
    str += "\"" + req.query.username + "\";";
    db.query(str, function (err, data){
        if(data.length === 1){
            res.send({state: 1})
        }
        else{
            let tmp = "select * from user where email = " + "\"" + req.query.email + "\";";
            db.query(tmp, function (err, re){
                if(re.length === 1){
                    res.send({state: 2})
                }
                else{
                    let insert = "insert into user (username, password, sex, email, phone) values (";
                    insert += "\"" + req.query.username + "\", \"" + req.query.password + "\", \"" + req.query.sex + "\", \""
                        + req.query.email + "\", \"" + req.query.phone + "\");";
                    db.query(insert, function(err, data){
                        if(err){
                            console.log(err.message);
                        }
                        fs.mkdir("../../projects/" + req.query.username, function (err){
                            if(err){
                                console.log(err)
                            }
                        })
                        res.send({state: 0})
                    });
                }
            })
        }
    })
})

app.post("/edituser", async function(req,res){
    let str = "select * from user where id = ";
    str += "\"" + req.query.id +"\";";
    await db.query(str, function (err, data){
        if(err){
            res.send(err);
        }
        else{
            let check = "select * from user where ";
            check += "id != \"" + req.query.id + "\" and username = \"" +req.query.username + "\";";
            db.query(check, function (err, data){
                if(data.length != 0){
                    console.log(err);
                }
                else{
                    let update = "update user set ";
                    update += "username = \"" + req.query.username + "\", sex = \"" + req.query.sex +"\", email = \"" + req.query.email +
                        "\", phone = \"" +req.query.phone + "\" where id = \"" + req.query.id + "\";";
                    db.query(update, function (err, data){
                        if(err){
                            console.log("update failed");
                        }
                    })
                }
                res.send(data);
            })
        }
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})