const express=require('express')
const bodyParser = require('body-parser')
const fs=require('fs')
const app=express()
const mysql=require('mysql')
const res = require('express/lib/response')
const { stringify } = require('querystring')
const conn={
    host:'localhost',
    user:'root',
    password:'1234',
    database:'mydb'
}
let connection=mysql.createConnection(conn)
connection.connect()

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.get("/",(request,response)=>{
    fs.readFile("./login.html",(error,data)=>{
        response.writeHead(200,{'Content-Type':"text/html"})
        response.end(data)
    })
})
let count=0
app.post("/login",async (request,response)=>{
    let id=request.body.user_id
    let pw=request.body.user_pw
    let query=`select * from students where user_id="${id}" and user_pw="${pw}";`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0) {
            if(id=="admin" && pw=="admin") response.send('<script>alert("관리자 전용 페이지로 이동합니다."); location.replace("/admin")</script>')
            else {
                count++
                if(count<3) response.send('<script>alert("아이디 혹은 비밀번호가 틀렸습니다."); location.replace("/")</script>')
                else response.send(`<script>alert("비밀번호를 ${count}회 틀렸습니다. 비밀번호를 확인해주세요."); location.replace("/")</script>`)
            }
        }
        else {
            count=0
            response.render(__dirname+'/user.ejs',{results})
        }
    })
})
app.get("/user/enrol",(request,response)=>{
    let id=request.param('user_id')
    let name=request.param('user_name')
    let arr=[id,name]
    let query=`select * from subjects;`
    connection.query(query,function(err,all_subjects,fields){
        if(err) console.log(err)
        if(all_subjects.length==0) arr.push('')
        else arr.push(all_subjects)
    })
    query=`select subject_name from enrol where user_id="${id}"`
    connection.query(query,function(err,enrol_subjects,fields){
        if(err) console.log(err)
        if(enrol_subjects.length==0) arr.push('')
        else arr.push(enrol_subjects)
    })
    query=`SELECT SUM(subject_grade) as gradesum FROM enrol NATURAL JOIN subjects WHERE user_id="${id}"`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0) arr.push('')
        else arr.push(results)
        response.render(__dirname+'/enrol.ejs',{arr})
    })
})
app.post("/user/enrol/add",(request,response)=>{
    let id=request.body.user_id
    let uname=request.body.user_name
    let sname=request.body.subject_name
    let query=`select * from subjects where subject_name="${sname}"`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0)response.send(`<script>alert("존재하지 않는 교과목입니다!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}") </script>`)
        else{
            let query=`select * from enrol where user_id="${id}" and subject_name="${sname}"`
            connection.query(query,function(err,results,fields){
                if(err) console.log(err)
                if(results.length==0){
                let query=`insert into enrol(user_id, subject_name) values("${id}","${sname}")`
                connection.query(query,function(err,results,fields){
                    if(err) console.log(err)
                    if(results.length==0) response.send(`<script>alert("다시 시도해주세요!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}")</script>`)
                    else response.send(`<script>alert("성공적으로 추가되었습니다!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}")</script>`)
                })
                }
                else{
                    response.send(`<script>alert("이미 존재하는 교과목입니다!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}") </script>`)
                }
            })
        }
    })
})
app.post("/user/enrol/delete",(request,response)=>{
    let id=request.body.user_id
    let uname=request.body.user_name
    let sname=request.body.subject_name
    let query=`select * from subjects where subject_name="${sname}"`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0)response.send(`<script>alert("존재하지 않는 교과목입니다!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}") </script>`)
        else{
            let query=`select * from enrol where user_id="${id}" and subject_name="${sname}"`
            connection.query(query,function(err,results,fields){
                if(err) console.log(err)
                if(results.length==0){
                    response.send(`<script>alert("수강 중인 교과목이 아닙니다!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}") </script>`)
                }
                else{
                    let query=`delete from enrol where subject_name="${sname}"`
                    connection.query(query,function(err,results,fields){
                        if(err) console.log(err)
                        if(results.length==0) response.send(`<script>alert("다시 시도해주세요!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}")</script>`)
                        else response.send(`<script>alert("성공적으로 삭제되었습니다!"); location.replace("/user/enrol?user_id=${id}&subject_name=${sname}&user_name=${uname}")</script>`)
                    })
                }
            })
        }
    })
})
app.get("/signUp",(request,response)=>{
    fs.readFile("./signUp.html",(error,data)=>{
        response.writeHead(200,{'Content-Type':"text/html"})
        response.end(data)
    })
})
app.post("/register",(request,response)=>{
    let id=request.body.user_id
    let pw=request.body.user_pw
    let name=request.body.user_name
    let query=`select * from students where user_id="${id}";`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0){
            let query=`insert into students(user_id,user_pw,user_name) values("${id}","${pw}","${name}")`
            connection.query(query,function(err,results,fields){
                if(err) console.log(err)
                if(results.length==0) response.send('<script>alert("다시 시도해주세요!"); location.replace("/signUp")</script>')
                else response.send('<script>alert("성공적으로 가입되었습니다!"); location.replace("/signUp")</script>')
            })
        }
        else{
            response.send('<script>alert("이미 존재하는 아이디입니다!"); location.replace("/signUp")</script>')
        }
    })
})
app.set('view engine', 'ejs')
app.get("/admin",(request,response)=>{
    fs.readFile("./admin.html",(error,data)=>{
        response.writeHead(200,{'Content-Type':"text/html"})
        response.end(data)
    })
})
app.get("/admin/subject",(request,response)=>{
    let query=`select * from subjects;`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        let output=`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>교과목 관리</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Jua&display=swap');
                *{font-family: 'Jua', sans-serif;}
            </style>
        </head>
        <body>
            <h1>교과목 관리</h1><hr>
            <div>
                <fieldset style="width:300px">
                    <legend>과목 추가</legend>
                    <form action ='/admin/subject/add' method="post">
                        <input type="text" name="subject_name1" placeholder="추가 할 과목명"> &nbsp; <input type="number" name="subject_grade" placeholder="학점" style="width:40px"> &nbsp; <input type="submit" value="추가">
                    </form>
                </fieldset>
                <fieldset style="width:300px">
                    <legend>과목 삭제</legend>
                    <form action ='/admin/subject/delete' method="post">
                        <input type="text" name="subject_name2" placeholder="삭제 할 과목명"> &nbsp; <input type="submit" value="삭제">
                    </form>
                </fieldset>
            </div>
            <h2>등록된 교과목 리스트</h2>
        `
            output+='<table border="1"> <tr><th>과목명<th>학점'
            for(let i of results){
                output+=`<tr><td>${i.subject_name}<td style="text-align:center">${i.subject_grade}`
            }
            output+='</table>'
            output+=`</body></html>`
            response.send(output)
    })
})
app.post("/admin/subject/add",(request,response)=>{
    let name=request.body.subject_name1
    let grade=request.body.subject_grade
    let query=`select * from subjects where subject_name="${name}";`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0){
            let query=`insert into subjects(subject_name,subject_grade) values("${name}","${grade}")`
            connection.query(query,function(err,results,fields){
                if(err) console.log(err)
                if(results.length==0) response.send('<script>alert("다시 시도해주세요!"); location.replace("/admin/subject")</script>')
                else response.send(`<script>alert("${name} 과목이 성공적으로 추가되었습니다!"); location.replace("/admin/subject")</script>`)
            })
        }
        else{
            response.send('<script>alert("이미 존재하는 과목입니다!"); location.replace("/admin/subject")</script>')
        }
    })
})
app.post("/admin/subject/delete",(request,response)=>{
    let name=request.body.subject_name2
    let query=`select * from subjects where subject_name="${name}";`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0) response.send('<script>alert("존재하지 않는 과목입니다!"); location.replace("/admin/subject")</script>')
        else{
            let query=`delete from subjects where subject_name="${name}";`
            connection.query(query,function(err,results,fields){
                if(err) console.log(err)
                if(results.length==0) response.send('<script>alert("다시 시도해주세요!"); location.replace("/signUp")</script>')
                else response.send(`<script>alert("${name} 과목이 성공적으로 삭제되었습니다!"); location.replace("/admin/subject")</script>`)
            })
        }
    })
})

app.get("/admin/status",(request,response)=>{
    let query=`select * from students;`
    let arr=[]
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0) arr.push('')
        else arr.push(results)
    })
    query=`select * from enrol;`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0) arr.push('')
        else arr.push(results)
        response.render(__dirname+'/status.ejs',{arr})
    })
})

app.get("/admin/status/user",(request,response)=>{
    let id=request.param('userid')
    let arr=[]
    let query=`select user_name from students where user_id="${id}"`
    connection.query(query,function(err,results,fields){
        if(err) console.log(err)
        if(results.length==0) arr.push('')
        else arr.push(results)
    })
    query=`select subject_name from enrol where user_id="${id}"`
    connection.query(query,function(err,results2,fields){
        if(err) console.log(err)
        if(results2.length==0) arr.push('')
        else arr.push(results2)
        response.render(__dirname+'/onlystatus.ejs',{arr})
    })
})


app.listen(22222,()=>{
    console.log('server start')
})
