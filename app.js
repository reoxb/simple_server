//aplicacion que sirve archivos con express
// const http = require('http');
const express = require('express');
//necesario el middlewere para post
const bodyParser = require('body-parser');
//necesario para hacer resquest a un api externa
const cors = require('cors');

const app = express();
app.use(cors());

//variables del servidor
const port = process.env.PORT || 8080;
const hostname = 'localhost';

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//carga todos los archivos estaticos dentro del directorio
app.use(express.static(__dirname + '/www', { index: 'login.html' }));

app.post('/action_page', (req, res) => {
  const users = [
    {email: 'l.quezada@cimmyt.org', password: '12345'},
    {email: 'l.puebla@cimmyt.org', password: '12345' },
    {email: 'j.s.sosa@cimmyt.org', password: '12345'},
    {email: 'admin', password: 'admin'}
  ];

  const isLoggin = users.filter((user)=> JSON.stringify(user) === JSON.stringify(req.body)); 

  if(isLoggin.length){
    const email = req.body.email;
    const password = req.body.password;
    console.log(`Wellcome: your email address: ${email} and your password: ${password}`);
    res.redirect('index.html');
    // res.redirect('index.html' + '/' + req.body.user_name);
  }else{
    res.redirect('login.html');
  }
});

app.listen(port, hostname, () =>
  console.log(`File server running at http://${hostname}:${port}/`)
);
