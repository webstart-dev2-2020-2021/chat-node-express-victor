const express = require("express");
//const helmet = require('helmet');
const bodyParser = require('body-parser');
const urlencoderParser = bodyParser.urlencoded({extended : false});
const { User } = require('./models');
const { Op } = require('sequelize');
const flash = require('connect-flash')
const passport =  require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
//const io = require('socket.io')(http);

//const { emailRegex, usernameRegex, passwordRegex } = require('./helpers/regex.js');
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const usernameRegex = /^\w{6,20}$/;
const passwordRegex = /^\w{6,20}$/;
const app = express();
const http = require('http').createServer(app)
/*
let userInfos = {
    id : '',
    username : '',
    email : '',
    password : '',
    isAdmin : '',
};
*/

let message = {};
let oldInput = {};
let action;
const port = 4170
//app.use(helmet());
app.use(flash());
app.use(express.static('public'));
app.set('view engine', './views');
app.listen(port, () => console.log(`Serveur lancée sur le port ${port}`))

app.use(
    session({
        secret : 'unePhraseTrèsTrèsSecrète',
        resave : false,
        saveUninitialized : false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user,done) =>{
    done(null,user)
});

passport.deserializeUser((user,done) =>{
    done(null,user)
});

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({
                where: { username },
            })
            if (!user || user.password !== password) {
                 return done(null, false, {
                    success: false,
                    message: 'Mauvais identifiants',
                })
            }
            return done(null, user)
        } catch (error) {
            return done(error)
        }
    })
)

app.get('/', (req, res) => {
    res.status(200).render('index.ejs', )
})

app.get('/chat', (req, res) => {
    // if(!req.user){
    //     return res.redirect('/')
    // }
    const user = req.user
    const success = req.flash().success || [];
    res.status(200).render('chat.ejs', {success})
})

app.get('/disconnect', (req,res) =>{
    req.session.destroy();
    res.status(200).redirect('/')
})


app.get('/signup', (req, res) =>{
    res.status(200).render('signup.ejs', {message, oldInput})
    message = {};
    oldInput = {};
})

app.post('/signup', urlencoderParser, async (req, res) =>{
    try {
        console.log('POTS/signup -> req.body.email', req.body.email)
        console.log('POTS/signup -> req.body.password', req.body.password)
        const {username, email, password} = req.body

        if(!email.match(emailRegex)){
            console.log('email invalide ->', email)
            message = {
                status : 'failed',
                message : 'Votre e-mail doit contrenir une @ et aucun chiffre dans le nom de domaine !'
            }
            oldInput = {
                username : username,
                email : email
            }
            return res.status(400).redirect('/signup')
        }
        if(!username.match(usernameRegex)){
            console.log('username invalide ->', username)
            message = {
                status : 'failed',
                message : 'Votre nom d\'utilisateur doit contenir au moins 6 à 20 caractères !'
            }
            oldInput = {
                username : username,
                email : email
            }
            return res.status(400).redirect('/signup')
        }
        if(!password.match(passwordRegex)){
            console.log('password invalide ->', password)
            message = {
                status : 'failed',
                message : 'Votre not de passe doit contenir au moins 6 à 20 caractères !'
            }
            oldInput = {
                username : username,
                email : email
            }
            return res.status(400).redirect('/signup')
        }

        const [user, created] = await User.findOrCreate({
            where: {[Op.or] : [{username}, {email}]},
            defaults : {
                username, 
                email, 
                password,
                isAdmin : false,
            }
        })
        if(!created){
            message = {
                status : 'failed',
                message : "Impossible d\'enregistrer le nouvelle utilisateur ... Essayez un autre pseudo ou un autre e-mail !"
            }
            oldInput = {
                username : username,
                email : email
            }
            return res.status(400).redirect('/signup')
        }
        message = {
            status : 'successful',
            message : 'Nouvelle utilisateur enregistré avec succès !'
        }
        console.log('POTS/signup -> utilisateur crée', user)
        res.status(200).redirect('/signup')
    } catch (error) {
        console.log('Erreur dans le POTS/signup ->', error)
        res.status(500).render('500.ejs')
    }
})

app.get('/signin', (req, res) =>{
    const errors = req.flash().error || [];
    res.status(200).render('signin.ejs', {errors})
})

app.post('/signin', urlencoderParser, passport.authenticate('local', 
    {
    successFlash : 'Connexion réussie',
    successRedirect : '/chat',
    failureFlash : 'Mauvais identifiants',
    failureRedirect : '/signin'
    })
)

app.get('/profile', (req, res) =>{
    if(!req.user){
        return res.redirect('/')
    }
    const user = req.user
    console.log(user.username)
    res.status(200).render('profile.ejs', {user, message})
})


app.get('/edit', async (req, res) =>{
    if(!req.user){
        return res.redirect('/')
    }
    const user = await User.findByPk(req.user.id);
    action = "/update"
    res.status(200).render('profileEdit.ejs', {user, message, action})
    message = {};
})

app.post('/update', urlencoderParser, async (req, res) =>{
    if(!req.user){
        return res.redirect('/')
    }
    try {
        const userID = req.user.id;
        const {username, email, password} = req.body
        const user = await User.findByPk(userID);
        if(!user){
            return res.status(404).render('404.ejs')
        }

        if(!email.match(emailRegex)){
            console.log('email invalide ->', email)
            message = {
                message : 'Votre e-mail doit contrenir une @ et aucun chiffre dans le nom de domaine !'
            }
            return res.status(400).redirect('/edit')
        }
        if(!username.match(usernameRegex)){
            console.log('username invalide ->', username)
            message = {
                message : 'Votre nom d\'utilisateur doit contenir au moins 6 à 20 caractères !'
            }
            return res.status(400).redirect('/edit')
        }
        if(!password.match(passwordRegex)){
            console.log('password invalide ->', password)
            message = {
                message : 'Votre mot de passe doit contenir au moins 6 à 20 caractères !'
            }
            return res.status(400).redirect('/edit')
        }
        
        user.username = username;
        user.email = email;
        user.password =  password;
        const update = await user.save();
        if(!update){
            return res.status(400).redirect('/edit')
        }
        message = {
            message : 'Utilisateur modifier avec succès !'
        }
        res.status(200).redirect('/profile')
    } catch (error) {
        console.log('Erreur dans le POTS/signup ->', error)
        res.status(500).render('500.ejs')
    }
})

app.get('/delete', async (req, res) =>{
    if(!req.user){
        return res.redirect('/')
    }
    const user = await User.findByPk(req.user.id);
    if(!user){
        return res.status(404).render('404.ejs')
    }
    await user.destroy();
    req.session.destroy();
    res.status(200).redirect('/')
})

app.get('/admin', async (req, res) =>{
    if(!req.user || req.user.isAdmin === false){
        return res.redirect('/')
    }
    try {
        const users = await User.findAll()
        console.log('users ->', users)
        res.status(200).render('admin.ejs', {users, message})
        message = {};
    } catch (error) {
        console.log('Erreur dans le User.findAll() ->', error)
        res.status(500).render('500.ejs')
    }
})


app.get('/admin/edit/:userID', async (req, res) =>{
    if(!req.user || req.user.isAdmin === false){
        return res.redirect('/')
    }
    const userID = req.params.userID;
    const user = await User.findByPk(userID);
    if(!user){
        return res.status(404).render('404.ejs')
    }
    action = "/admin/update/"+userID
    res.status(200).render('profileEdit.ejs', {user, message, action})
    message = {};
})

app.post('/admin/update/:userID', urlencoderParser, async (req, res) =>{
    if(!req.user || req.user.isAdmin === false){
        return res.redirect('/')
    }
    try {
        const userID = req.params.userID;
        const {username, email, password, isAdmin} = req.body
        const user = await User.findByPk(userID);
        if(!user){
            return res.status(404).render('404.ejs')
        }

        if(!email.match(emailRegex)){
            console.log('email invalide ->', email)
            message = {
                message : 'Votre e-mail doit contrenir une @ et aucun chiffre dans le nom de domaine !'
            }
            return res.status(400).redirect('/admin/edit/'+userID)
        }
        if(!username.match(usernameRegex)){
            console.log('username invalide ->', username)
            message = {
                message : 'Votre nom d\'utilisateur doit contenir au moins 6 à 20 caractères !'
            }
            return res.status(400).redirect('/admin/edit/'+userID)
        }
        if(!password.match(passwordRegex)){
            console.log('password invalide ->', password)
            message = {
                message : 'Votre not de passe doit contenir au moins 6 à 20 caractères !'
            }
            return res.status(400).redirect('/admin/edit/'+userID)
        }
        
        user.username = username;
        user.email = email;
        user.password =  password;
        switch (isAdmin) {
            case 'true':
                user.isAdmin = true;
                break;
        
            default:
                user.isAdmin = false;
                break;
        }
        const update = await user.save();
        if(!update){
            return res.status(400).redirect('/admin/edit/:userID')
        }
        message = {
            message : 'Utilisateur modifier avec succès !'
        }
        res.status(200).redirect('/admin')
    } catch (error) {
        console.log('Erreur dans le POTS/signup ->', error)
        res.status(500).render('500.ejs')
    }
})

app.get('/admin/delete/:userID', async (req, res) =>{
    if(!req.user || req.user.isAdmin === false){
        return res.redirect('/')
    }
    const userID = req.params.userID;
    const user = await User.findByPk(userID);
    if(!user){
        return res.status(404).render('404.ejs')
    }
    await user.destroy();
    message = {
        message : 'Utilisateur supprimé avec succès !'
    }
    res.status(200).redirect('/admin')
})

app.get('*', (req, res) => {
    res.status(404).render('404.ejs')
})