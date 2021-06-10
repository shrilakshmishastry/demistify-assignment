const express = require('express');
var cors = require('cors');
var {lookup} = require('geoip-lite');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const redis = require('redis');
const router = express.Router();


app.use(cors({
    credentials:true,
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    origin: 'http://localhost:3000'
}));
app.use(cookieParser());
app.use(session({
    secret : 'shri',
    saveUninitialized:true,
    resave:true,
}));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended:true}));

const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

var sess;


router.get('/',(req,res)=>{

    sess = req.session;
    console.log(sess.name+"root");
    if(sess.name){
        client.hgetall("userinfo",(err,result)=>{
            if(err) throw err;
            if(result != null){
                console.log(result[sess.name]);

               return res.send(result);
            }
        })

    }else{
    res.send("session not created");
}
})


router.get("/dashboard",(req,res)=>{
    sess = req.session;
    if(sess.name){
        return res.send(sess.name);
    }
   res.send("session not created dashboard");
})


router.post("/login",(req,res)=>{
    let time = new Date().toTimeString();
    sess = req.session;
    const add = lookup(req.body.ip);
    console.log(add.ll[0]);
    sess.name = req.body.name;
    var data = req.body;
    data = {...data,
         time : time ,
         lat :add.ll[0] ,
         lng : add.ll[1],
        };
    // console.log(data);
    client.hset("userinfo" , data.name , JSON.stringify(data),(err)=>{
        if(err){
            console.log(err);
        }
    });
    res.end("done");
})

router.get('/logout',(req,res)=>{
    var sess = req.session;
    client.hdel("userinfo",sess.name,(err,response)=>{
        if(err){
            console.log("error");
        }

    });
    req.session.destroy((err)=>{
        if(err){
            return res.end("failed");
        }else{
        res.send("Done");
    }
    })
})

app.use("/",router);

app.listen(process.env.port || 9000);
console.log("Web Server is listening at port " + (process.env.port || 9000));