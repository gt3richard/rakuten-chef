var express = require('express');
var bodyParser = require('body-parser')
var app = express();


app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());

app.get('/', function(request, response) {
  response.send("Hi, I'm Rakuten Chef!");
});

app.post('/', function(request, response) {
	
	console.log(request.body);
	
	var date = request.body.result.parameters.date;
	var meal = request.body.result.parameters.meal;
	
	var payload = [
	{date:'2-13-2017',menu:{breakfast:['eggs','bacon'],lunch:['sushi']}},
	{date:'2-14-2017',menu:{breakfast:['muffins'],lunch:['tacos','chips']}},
	{date:'2-15-2017',menu:{breakfast:['bagels','yogurt'],lunch:['pizza']}}
	];
	
	var value = {message:'We are having Soylent, sorry.'};
	if(date == 'today')
	{
		if(meal == 'breakfast')
			value = {message:'We are having '+ payload[0].menu.breakfast[0] +' today.'};
		else if(meal == 'lunch')
			value = {message:'We are having '+ payload[0].menu.lunch[0] +' today.'};
	}
	
	var apiResponse = {
		speech: value,
		displayText: value,
		data: {},
		contextOut: [],
		source: 'rakuten-chef'
	};
	
	response.send(apiResponse);
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});