const express=require('express');
const bodyParser=require('body-parser');
const cors=require('cors');
const knex=require('knex');
const nodemailer = require('nodemailer');
const crypto = require("crypto");




const db=knex({
	client:'pg',
	connection:{
		connectionString:process.env.DATABASE_URL,
		ssl: true		
	}
});



const app=express();
app.use(bodyParser.json());
app.use(cors());


app.get('/',(req,res)=>{
	db.select('*').from('sites').orderBy('m_sites_id','desc').then(sites=>{
		res.json(sites)
	})
})

app.get('/favorite',(req,res)=>{
	db.select('*').from('sites').whereIn('m_sites_id',[1,2,3,5,11]).orderBy('m_sites_id','desc').then(sites=>{
		res.json(sites)
	})
})

app.get('/moreinfo/:id',(req,res)=>{
	const {id}=req.params;
	db.select('*').from('sites').where('m_sites_id','=',id).then(sites=>{
		res.json(sites)
	})
})

app.post('/sendmail',(req,res)=>{
	const {name,email,message}=req.body;
	if(!name || 
		name.split('').filter(x => x === '{').length === 1 ||
		!email||email.split('').filter(x => x === '{').length === 1 ||
		!message||message.split('').filter(x => x === '{').length === 1){
		return res.status(400).json('Incorrect form.')
	}else {
		let transporter = nodemailer.createTransport({
					service: 'Gmail',
					host: 'smtp.gmail.com',		        
					auth: {
		            user: 'TestNodemailerYelcamp@gmail.com', // generated ethereal user
		            pass: `${process.env.email_pass}` // generated ethereal password
		        }
		    });	
				let mailOptions = {
		        from: 'TestNodemailerYelcamp@gmail.com', // sender address
		        to: 'ferromassimo1989@gmail.com', // list of receivers
		        subject: 'Work', // Subject line
		        text: `Email:${email} Name:${name} Message:${message}`
		      };
		      transporter.sendMail(mailOptions, (error, info) => {
		      	if (error) {
		      		return res.json('email not sent');
		      	}
		      	res.json('email sent')
		      	//console.log('Message sent: %s', info.messageId);
		      	//console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		      });	      
		  }	
	
})

app.post('/newComment',(req,res)=>{
	const {comment_text,username,sites_id,comment_added}=req.body;
	if(!user_id || 
		user_id.split('').filter(x => x === '{').length === 1 ||
		!comment_text||comment_text.split('').filter(x => x === '{').length === 1 ){
		return res.status(400).json('Incorrect form.')
	}else{
		db('comments')
		.returning(['m_comment_id','comment'])
		.insert({
			username: username,
			comment:comment_text,
			comment_added:comment_added,
			site_id:sites_id
		}).then(data=>{
			res.json(data[0])
		})
		.catch(err=> res.status(400).json('Unable to add that comment'))
	}
			
	
})

app.get('/allComment/:site_id',(req,res)=>{
	const {site_id}=req.params;
	db.from('comments').innerJoin('sites', 'sites.m_sites_id', 'comments.site_id')	
	.where('site_id','=',site_id)
	.orderBy('m_comment_id')
	.then(data=>{
		 res.json(data)
	})
	.catch(err=>{res.status(400).json('Unable to get comments')})
})

app.listen(process.env.PORT || 3001,()=>{console.log("app is running on port "+process.env.PORT)});