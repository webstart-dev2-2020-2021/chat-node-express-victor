const express = require("express")
const helmet = require('helmet')
const bodyParser = require('body-parser')
const urlencoderParser = bodyParser.urlencoded({extended : false})
const app = express()
app.use(helmet())
app.use(express.static('public'))
app.set('view engine', './views')
const port = 3000

app.listen(port, () => console.log(`Serveur lancée sur le port ${port}`))

app.get('/', (req, res) => {
    res.render('index.pug')
})

app.get('/chat', (req, res) => {
    res.render('chat.pug')
})

app.get('/signup', (req, res) =>{
    res.render('signup.pug')
})

app.post('/signup', urlencoderParser, (req, res) =>{
    console.log('POTS/signup -> req.body.email', req.body.email)
    console.log('POTS/signup -> req.body.password', req.body.password)
    res.render('signup.pug')
})

app.get('/signin', (req, res) =>{
    res.render('signin.pug')
})

app.post('/signin', urlencoderParser, (req, res) =>{
    console.log('POTS/signup -> req.body.email', req.body.email)
    console.log('POTS/signup -> req.body.password', req.body.password)
    res.render('signin.pug')
})

app.get('/admin', (req, res) =>{
    res.render('admin.pug')
})

app.get('*', (req, res) => {
    res.status(404).render('404.pug')
})