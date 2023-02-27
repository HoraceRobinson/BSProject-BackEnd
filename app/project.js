const express = require('express')
const router = express.Router()
const mysql = require("mysql")
const fs = require("fs")
const multer = require("multer")
const path = require("path");
const bodyParser = require('body-parser')
const buffer = require("buffer");
var db=mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "zbh11600",
    database: "bstest",
    multipleStatements: true
});
router.use(bodyParser.json())

router.post('/addproj', async function (req, res){
    let str = "select * from project ";
    str += "where project_name = \"" + req.query.project_name + "\" and user_id = \"" + req.query.user_id + "\";";
    await db.query(str, function (err, data){
        if(data.length !== 0){
            console.log(data)
            console.log('project already exists');
        }
        else{
            let tmp = "insert into project (project_name, project_type, project_info, created_time, user_id) values ";
            tmp += "(\"" + req.query.project_name + "\", \"" + req.query.project_type + "\", \"" +req.query.project_info
            + "\", \"" + req.query.createdtime + "\", \"" + req.query.user_id + "\");";
            db.query(tmp, function (err, data){
                if(err){
                    console.log(err);
                }
                else{
                    let dir = "select username as prt from user where id = " + "\"" + req.query.user_id + "\";";
                    db.query(dir, function (err, data){
                        fs.mkdir("../../projects/" + data[0].prt + "/" + req.query.project_name, function (error){
                            if(error){
                                console.log(error)
                            }
                        })
                    })
                }
            })
        }
        res.send(data);
    })
})

router.get('/getallproj', async function(req, res){
    let str = "select * from project where ";
    str += "user_id = \"" + req.query.user_id + "\";";
    await db.query(str, function (err, data){
        if(err){
            console.log(err);
        }
        res.send(data);
    })
})

router.get('/maxprojid', async function(req, res){
    let str = "select MAX(project_id) as max_id from project where user_id = ";
    str += "\"" + req.query.user_id + "\";";
    await db.query(str, function (err, data){
        if(err){
            console.log(err);
        }
        res.send(data);
    })
})

router.post('/addtags', async function(req, res){
    for(var i = 0; i < req.query.tags.length; i++){
        var str = "insert into tag (project_id, tag_name) values(" + "\"" + req.query.project_id + "\", \"" + req.query.tags[i] + "\");";
        await db.query(str, function (err, data){
            if(err){
                console.log(err);
            }
        })
    }
})

router.get('/gettags', async function(req, res){
    let str = "select tag_name from tag where project_id = " + "\"" + req.query.project_id + "\";";
    await db.query(str, function (err, data){
        res.send(data);
    })
})

router.post('/changetags', async function(req, res){
    let tmp = "delete from tag where project_id = " + "\"" + req.query.project_id + "\";";
    await db.query(tmp, function (err, data){
        if(err){
            console.log(err);
        }
        else{
            for(var i = 0; i < req.query.tags.length; i++){
                var str = "insert into tag (project_id, tag_name) values(" + "\"" + req.query.project_id + "\", \"" + req.query.tags[i] + "\");";
                db.query(str, function (err, data){
                    if(err){
                        console.log(err);
                    }
                })
            }
            let s = "update project set project_info = " + "\"" + req.query.project_info + "\" where project_id = " + "\"" + req.query.project_id + "\";";
            db.query(s, function (err, data){
                if(err){
                    console.log(err)
                }
            })
        }
        res.send({state: true})
    })
})

router.post('/uploadfile', multer({dest: '../../projects/files'}).single('file'),(req, res) => {
    let oldname = req.file.path;
    let newname = "..\\..\\projects\\files\\" + req.file.originalname;
    fs.renameSync(oldname, newname);
    res.send(req.file)
})

router.post('/savevideopictures', function (req,res){
    if(req.body.imgdata){
        let path = '../../projects/videofiles/'+req.body.videoname
        let sql = ''
        if(!fs.existsSync(path)){
            fs.mkdirSync(path)
        }
        for(let i in req.body.imgdata){
            var avatar = req.body.imgdata[i].replace(/^data:image\/\w+;base64,/, '');
            var newbuf = new Buffer(avatar, 'base64')
            var name = new Date().getTime() + '.jpg'
            fs.writeFileSync(path + '/' + name, newbuf, 'binary', function (err){
                if(err){
                    console.log(err)
                }
            })
            sql += "insert into video(project_id, pic_name) values(" + "\"" + req.body.project_id + "\", \"" + name + "\");";
        }

        db.query(sql, function (err){
            if(err){
                res.send({state: false})
            }
            else{
                res.send({state: true})
            }
        })

    }
})

router.post('/changefiles', function (req, res){
    let str = "insert into image (img_name, project_id) values ("
    if(req.query.files !== []){
        for(var i = 0; i < req.query.files.length; i++){
            let tmp = str + "\"" + req.query.files[i] + "\", \"" + req.query.project_id + "\");";
            db.query(tmp, function (err){
                if(err){
                    console.log(err);
                }
            })
        }
    }
})

router.get('/getfiles', function (req, res){
    let str = "select img_name from image where project_id = " + "\"" + req.query.project_id + "\";";
    db.query(str, function (err, data){
        res.send(data);
    })
})

router.get('/getvideofiles', function (req, res){
    let str = "select pic_name from video where project_id = " + "\"" + req.query.project_id + "\";";
    db.query(str, function (err, data){
        res.send(data);
    })
})

router.get('/getworkspace', function (req, res){
    let str = "select * from workspace where user_id = " + "\"" + req.query.user_id + "\";";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
        }
        res.send(data);
    })
})

router.post('/updatework', function (req, res){
    let str = "update project set state = '3' where project_id = " + "\"" + req.query.project_id + "\";";
    let tmp = "update workspace set project_id = " + "\"" + req.query.project_id + "\" where work_name = \"" + req.query.work_name
    + "\" and user_id = \"" + req.query.user_id + "\";";
    db.query(str, function (err, data){
        if(err){
            res.send({state: false});
        }
        else{
            db.query(tmp, function (err, data){
                if(err){
                    res.send({state: false});
                }
                else{
                    res.send({state: true});
                }
            })
        }
    })
})

router.post('/savelabel', function (req, res){
    let str = "delete from img_label where project_id = " + "\"" + req.body.project_id + "\" and img_url = \""
        + req.body.img_url + "\";";
    db.query(str);
    if(req.body.alldata.length !== 0){
        for(let i in req.body.alldata){
            let item = req.body.alldata[i];
            let tmp = "insert into img_label (project_id, img_url, x, x1, y, y1, uuid, tag, tagName) values (" + "\"" +
                req.body.project_id + "\", \"" + req.body.img_url + "\", \"" + item.position.x + "\", \"" + item.position.x1 +
                "\", \"" + item.position.y + "\", \"" + item.position.y1 + "\", \"" + item.uuid + "\", \"" + item.tag +
                "\", \"" + item.tagName + "\");";
            db.query(tmp, function (err){
                if(err){
                    console.log(err)
                }
            })
        }
    }

    res.send({save: true});
})

router.get('/getlabel', function (req, res){
    let str = "select * from img_label where project_id = " + "\"" + req.query.project_id + "\" and img_url = \"" + req.query.img_url + "\";";
    db.query(str, function (err, data){
        res.send(data);
    })
})

router.post('/settask', function (req, res){
    let str = "update project set state = '1' where project_id = " + "\"" +req.query.project_id + "\";";
    db.query(str, function (err){
        if(err){
            res.send({state: false});
        }
        else{
            res.send({state: true});
        }
    })
})

router.post('/saveJSON', function (req, res){
    let str = "{\"path\":\"D:/BSProject/projects/files/" + req.body.img_name + "\",\"outputs\":[";
    let labs = req.body.allInfo;
    for (var i = 0;  i < labs.length; i++){
        str += "{\"name\":\"" + labs[i].tagName + "\",\"bndbox\":{\"x\":\"" + labs[i].position.x + "\",\"y\":\"" + labs[i].position.y
        + "\",\"x1\":\"" + labs[i].position.x1 + "\",\"y1\":\"" + labs[i].position.y1 + "\"}}";
        if(i !== labs.length - 1){
            str += ",";
        }
    }
    str += "],\"time_labeled\":" + req.body.time + ",\"labeled\":\"true\",\"size\":{\"width\":" + req.body.imageinfo.rawW +
    ",\"height\":" + req.body.imageinfo.rawH + "}}";
    fs.writeFileSync('D:/BSProject/projects/outputs/json/'+req.body.filename+".json", str, function (err){
        if(err){
            console.log(err)
        }
    })
    res.send({state: true, name: req.body.filename});
})

router.post('/saveprojVOC', function (req, res){
    let str = "select * from img_label where project_id = " + "\"" + req.query.project_id + "\";";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
        }
        else{
            let labs = data;
            let tmp = "select distinct img_url from img_label where project_id = " + "\"" + req.query.project_id + "\";";
            db.query(tmp, function (err, result){
                if(err){
                    console.log(err)
                }
                else{
                    let pics = result;
                    let pic_name = [];
                    for(let i in pics){
                        let tmp = pics[i].img_url;
                        pic_name.push(tmp.substring(5, tmp.indexOf('.')) + tmp.substring(tmp.length - 4));
                    }
                    let path = 'D:/BSProject/projects/outputs/voc/' + req.query.project_id
                    if(!fs.existsSync(path)){
                        fs.mkdirSync(path)
                        fs.mkdirSync(path + '/Annotation')
                        fs.mkdirSync(path + '/ImageSets')
                    }
                    let main = '';
                    for(let i in pic_name){
                        main += pic_name[i];
                        if(i !== pic_name.length - 1){
                            main += ', ';
                        }
                        let res = "<?xml version=\"1.0\" ?>\n<annotation>\n<folder>projects/outputs</folder>\n<filename>"
                        + pic_name[i] + "</filename>\n" + "<path>D:\\BSProject\\projects\\files\\" + pic_name[i]
                        + "</path>\n<source>\n" +
                            "    <database>Unknown</database>\n" +
                            "</source><size>\n" +
                            "    <width>924</width>\n" +
                            "    <height>520</height>\n" +
                            "</size>\n" +
                            "\n" +
                            "<segmented>0</segmented>\n";
                        for(let j in labs){
                            if(labs[j].img_url === pics[i].img_url){
                                res += "<object>\n" +
                                    "    <name>" + labs[j].tag +"</name>\n" +
                                    "    <pose>Unspecified</pose>\n" +
                                    "    <truncated>0</truncated>\n" +
                                    "    <difficult>0</difficult>\n" +
                                    "    <bndbox>\n" +
                                    "        <xmin>" + labs[j].x + "</xmin>\n" +
                                    "        <ymin>" + labs[j].y +"</ymin>\n" +
                                    "        <xmax>" + labs[j].x1 + "</xmax>\n" +
                                    "        <ymax>" + labs[j].y1 + "</ymax>\n" +
                                    "    </bndbox>\n" +
                                    "</object>\n";
                            }
                        }
                        res +="</annotation>";
                        fs.writeFileSync(path + '/Annotation/'
                            + pic_name[i].substring(0,pic_name[i].length-4) + ".xml", res, function (err){
                            if(err){
                                console.log(err)
                            }
                        } )
                        fs.writeFileSync(path + '/ImageSets/Main.txt', main, function (err){
                            if(err){
                                console.log(err)
                            }
                        })
                    }
                }
            })
        }
    })
    res.send({state: true})
})

router.post('/saveprojCOCO', function (req, res){
    let str = "select * from img_label where project_id = " + "\"" + req.query.project_id + "\";";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
            res.send({state: false})
        }
        else{
            let labelset = {
                info: '',
                license: '',
                images: [],
                annotations: [],
                categories: []
            }
            for(let i in data){
                let url = '../../projects/files/' + data[i].img_url.substring(5);
                labelset.images.push({
                    license:"",
                    file_name:data[i].task_name,
                    coco_url:url,
                    height:"924",
                    width:"500",
                    date_captured:"2022-1",
                    flickr_url:"",
                    id:"",
                });
                labelset.annotations.push({
                    segmentation:"",
                    area:"",
                    iscrowd:"",
                    image_id:i+1,
                    bbox:[data[i].x,data[i].y,data[i].x1,data[i].y1],
                    category_id: data[i].tag,
                    id:i+1
                });
                labelset.categories.push({
                    supercategory: data[i].tagName,
                    id: data[i].tag,
                    name:data[i].tagName
                })
            }
            let jsondata = JSON.stringify(labelset, undefined, 4)
            fs.writeFileSync('../../projects/outputs/coco/' + req.query.project_id + '-' + new Date().getTime() + '.json', jsondata, function (err){
                if(err){
                    console.log(err);
                }
            })
            res.send({state: true});
        }
    })
})

router.get('/getuptask',function (req, res){
    let str = "select * from project where user_id = " + "\"" + req.query.user_id + "\" and state > 0 and state != 3;";
    db.query(str, function (err, data){
        if(err){
            console.log(err);
        }
        else{
            res.send(data);
        }
    })
})

router.get('/getmytask', function (req, res){
    let str = "select * from project where co_user = " + "\"" + req.query.user_id + "\"";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
        }
        else{
            res.send(data)
        }
    })
})

router.get('/getonlinetask',  function (req, res){
    let str = "select * from project where state = 1;";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
        }
        else{
            res.send(data)
        }
    })
})

router.get('/getusername', function (req, res){
    let str = "select id, username from user;";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
        }
        else{
            res.send(data)
        }
    })
})

router.post('/updatetask', function (req, res){
    let str = "update project set state = " + "\"" + req.query.state + "\", co_user = \"" + req.query.co_user + "\" where project_id = \""
    + req.query.project_id + "\";";
    db.query(str, function (err){
        if(err){
            res.send({state: false})
        }
        else{
            res.send({state: true})
        }
    })
})

router.post('/updatestate', function (req, res){
    let str = " update project set state = " + "\"" + req.query.state + "\" where project_id = \"" + req.query.project_id + "\";";
    db.query(str, function (err){
        if(err){
            res.send({state: false})
        }
        else{
            res.send({state: true})
        }
    })
})

router.post('/endtask', function (req, res){
    let str = "update project set finished_time = " + "\"" + req.query.finished_time + "\", state = \"" + req.query.state +
        "\" where project_id = \"" + req.query.project_id + "\";";
    db.query(str, function (err){
        if(err){
            console.log(err)
            res.send({state: false})
        }
        else{
            res.send({state: true})
        }
    })
})

router.post('/deleteproj', function (req, res){
    let str = "delete from project where project_id = " + "\"" + req.query.project_id + "\"; delete from image where project_id = \""
    + req.query.project_id + "\"; delete from tag where project_id = \"" + req.query.project_id + "\"; delete from img_label where project_id = \""
    + req.query.project_id + "\"; delete from video where project_id = \"" + req.query.project_id + "\";";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
            res.send({state: false})
        }
        else{
            res.send({state: true})
        }
    })
})

router.get('/getvideoname', function (req, res){
    let str = "select img_name from image where project_id = " + "\"" + req.query.project_id + "\";";
    db.query(str, function (err, data){
        if(err){
            console.log(err)
        }
        res.send(data)
    })
})

router.get('/getallfiles', function (req, res){
    fs.readdir('../../projects/files', function (err, data){
        res.send(data)
    })
})

module.exports = router