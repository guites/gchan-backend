const Joi = require('joi');
const db = require('./connection'); //relative path to file that exports

const schema = Joi.object().keys({
	username: Joi.string().alphanum().required(),
	subject: Joi.string().required(),
	message: Joi.string().max(250).required(),
	imageURL: Joi.string().uri({
		scheme: [
			/https?/
		]
	}).allow(''),
	giphyURL: Joi.string(),
  options: Joi.string(),
  user_id: Joi.number(),
  gif_origin: Joi.string(),
});

const slackSchema = Joi.object().keys({
  token: Joi.string().alphanum().required(),
  team_id: Joi.string().alphanum().required(),
  team_domain: Joi.string().alphanum().required(),
  channel_id: Joi.string().alphanum().required(),
  channel_name: Joi.string().alphanum().required(),
  user_id: Joi.string().alphanum().required(),
  user_name: Joi.string().required(),
  command: Joi.string().required(),
  text: Joi.string().required(),
  api_app_id: Joi.string().alphanum().required(),
  is_enterprise_install: Joi.string().max(5),
  response_url: Joi.string().uri({
    scheme: [
      /https/
    ]
  }),
  trigger_id: Joi.string().required(),
});

// const messages = db.get('messages');

async function getAll(){
	try{
		const client = await db.connect();
		const result = await client.query('SELECT * FROM messages');
		const results = { 'results': (result) ? result.rows : null};
		client.release();
		return results;
	} catch (err){
		console.error(err);
		res.json( err );
	}
}

async function deleteMessage(messageID){
  try {
    const sql = 'DELETE FROM messages WHERE id = $1 RETURNING id';
    const values = [messageID];
    const client = await db.connect();
    try {
      const query_res = await client.query(sql,values);
      client.release();
      console.log(query_res);
      if(query_res.rows.length > 0){
        return ({'id': query_res.rows[0].id});
      }
      return (false);
    } catch (err) {
      console.log(err.stack);
      return(err);
    }
  } catch (err) {
    console.log(err);
    return (err);
  }
}

async function postMessageFromSlack(post){
  const postBody = post.body;
  if(postBody.token != process.env.SLACK_TOKEN) return res.json('invalid slack token');
  const result = slackSchema.validate(postBody);
  if(result.error == null){
    const message = {};
    const payload = postBody.text.split(';');
    if(payload.length < 2) return JSON.stringify({'url': process.env.CORS_ORIGIN_URL + '/g', 'mensagem': '(⌐■_■) utilize no formato /gchan minha mensagem ; https://wwww.urldaminhaimagem.com/ou_gif/ou_video'});
    if(payload.length > 2){
      message.username = 'Anonymous';
    } else {
      message.username = postBody.user_name;  
    }
    message.slack_id = postBody.user_id;
    message.user_id = 0;
    message.subject = 'slackin';
    message.message = payload[0];
    message.imageURL = payload[1].trim();
    message.giphyURL = '';
    message.created = new Date();
    try{
      const sql = 'INSERT INTO messages (username, subject, message, imageURL, giphyURL, created, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id';
      const values = [message.username, message.subject, message.message, message.imageURL, message.giphyURL, message.created, message.user_id];
      const client = await db.connect();
      try {
        const query_res = await client.query(sql, values);
        client.release();
        return JSON.stringify({'url': process.env.CORS_ORIGIN_URL + '/g', 'mensagem': 'obrigado por usar o gchan (⌐■_■)'});
      } catch(err){
        client.release();
				console.log(err.stack)
      }
    } catch(err) {
			console.error(err);
			return (err);
    }
  } else {
    return Promise.reject(result.error);
  }
}

async function postMessage(message){
  const messageBody = message.body;
  console.log(messageBody);
	if (!messageBody.username) messageBody.username = 'Anonymous';
	if (!messageBody.imageURL) messageBody.imageURL = '';
	const result = schema.validate(messageBody);
	if(result.error == null){
		messageBody.created = new Date();
		try{
			const sql = 'INSERT INTO messages (username, subject, message, imageURL, giphyURL, options, created, user_id, gif_origin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id';
			const values = [messageBody.username, messageBody.subject, messageBody.message, messageBody.imageURL,messageBody.giphyURL,messageBody.options,messageBody.created,messageBody.user_id, messageBody.gif_origin];
      const client = await db.connect();
			try {
				const query_res = await client.query(sql,values);
        client.release();
        console.log(query_res);
				const returnJSON = {
					username:values[0],
					subject:values[1],
					message:values[2],
					imageurl:values[3],
					giphyURL:values[4],
					options:values[5],
					created:values[6],
          id:query_res.rows[0].id,
          user_id:values[7],
          gif_origin:values[8]
				};
				return JSON.stringify(returnJSON);
			} catch (err) {
        console.log(err);
				console.log(err.stack)
			}
		} catch (err){
			console.error(err);
			return (err);
		}
	} else {
		return Promise.reject(result.error);
	}
}

module.exports.deleteMessage = async function(){
  return deleteMessage();
}

module.exports.postMessageFromSlack = async function(){
  return postMessageFromSlack();
}
module.exports.postMessage = async function(){
	return postMessage();
}

module.exports.getAll = async function(){
	return getAll();
}
module.exports = {
  postMessageFromSlack,
	postMessage,
  getAll,
  deleteMessage,
	schema
};