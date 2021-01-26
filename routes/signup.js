const {User, validate} = require('../models/user');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const bcrypt = require('bcrypt');
const mailgun = require("mailgun-js");

const DOMAIN = "sandbox5ac2f8c09f514bb5b1c3a831ec4f8b52.mailgun.org";
const mg = mailgun({apiKey: "f2fa1e7c3cbd698b42f99b2b562f0b0b-07bc7b05-0da1661a", domain: DOMAIN});


router.post('/', async (req, res) => {
    const { error } = validate(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

   let user = await User.findOne({email : req.body.email});
   if (user) return res.status(400).send('Email is already registred');

    user = new User(_.pick(req.body, ['name', 'email', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const data = {
        from: 'hi@hell.com',
        to: req.body.email ,
        subject: 'Hello',
        text: 'Testing some Mailgun awesomness!'
    };

    mg.messages().send(data, function (error, body) {
        console.log(body);
    });

    await user.save();

    const token = user.generateAuthToken();
    res.header('x-auth-token',token).send(_.pick(user,['_id','name', 'email']));
});

module.exports = router
