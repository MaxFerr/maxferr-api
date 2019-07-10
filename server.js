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

const check=(data)=>{
	if (data.split('').filter(x => x === '{').length >= 1) {
		return true
	}else{
		return false
	}
}

const app=express();
app.use(bodyParser.json());
app.use(cors());

//selecting and sending all the sites from the db to the FE
app.get('/',(req,res)=>{
	db.select('*').from('sites').orderBy('m_sites_id','desc').then(sites=>{
		res.json(sites)
	})
})

//selecting the favorite sites from the db
app.get('/favorite',(req,res)=>{
	db.select('*').from('sites').whereIn('m_sites_id',[1,2,3,5,11]).orderBy('m_sites_id','desc').then(sites=>{
		res.json(sites)
	})
})

//getting more info about a site(id) and sending it to the FE 
app.get('/moreinfo/:id',(req,res)=>{
	const {id}=req.params;
	db.select('*').from('sites').where('m_sites_id','=',id).then(sites=>{
		res.json(sites)
	})
})

//sending mail thru nodemailer
app.post('/sendmail',(req,res)=>{
	const {name,email,message}=req.body;
	if(!name ||	check(name) ||!email||check(email) ||!message||check(message)){
		return res.status(400).json('Incorrect form.')
	}else {
		//setting the transporter
		let transporter = nodemailer.createTransport({
					service: 'yahoo',		        
					auth: {
		            user: 'TestNodemailerYelcamp@yahoo.com', // generated ethereal user
		            pass: `${process.env.email_pass}` // generated ethereal password
		        }
		    });	
		//setting the mail form
				let mailOptions = {
		        from: 'TestNodemailerYelcamp@yahoo.com', // sender address
		        to: 'ferromassimo1989@gmail.com', // list of receivers
		        subject: 'Work', // Subject line
		        text: `Email:${email} Name:${name} Message:${message}`
		      };
		      //sending the mail
		      transporter.sendMail(mailOptions, (error, info) => {
		      	if (error) {
		      		console.log(error)
		      		return res.json('email not sent');
		      	}
		      	res.json('email sent')
		      	//console.log('Message sent: %s', info.messageId);
		      	//console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		      });	      
		  }	
	
})

//inserting new comment in the db
app.post('/newComment',(req,res)=>{
	const {comment_text,username,sites_id,comment_added}=req.body;
	if(!user_id ||check(user_id)||!comment_text||check(comment_text) ){
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

//getting all the comments from the db
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