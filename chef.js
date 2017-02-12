var express = require('express');
var bodyParser = require('body-parser');
var requester = require('request');
var jsonQuery = require('json-query');
var cheerio = require('cheerio');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());

function NormalizeDay(date)
{
	var day = 0;
	if(date == 'today')
	{
		day = new Date().getDay();
	}
	else if(date == 'tomorrow')
	{
		var currDay = new Date();
		currDay.setDate(currDay.getDate() + 1);
		day = currDay.getDay();
	}
	
	switch (day) {
    case 0: return "Sunday";
    case 1: return "Monday";
	case 2: return "Tuesday";
	case 3: return "Wednesday";
	case 4: return "Thursday";
	case 5: return "Friday";
	case 6: return "Saturday";
	}
}


app.get('/', function(request, response) {
  response.send("Hi, I'm Rakuten Chef!");
});

app.get('/json', function(request, response){
	var sourceUrl = "http://static.wixstatic.com/sites/068198_cef0516e50e786d502f2ef867a85196e_572.json.z?v=3";

	requester({method: 'GET', uri: sourceUrl , gzip: true, json: true} ,function (error, res, body) {
		if (!error && res.statusCode == 200) {
			
			var html = jsonQuery('data.document_data.dataItem-iqtw5gn6.text', { data: body}).value;
			var $ = cheerio.load(html);
			
			$('p').each(function(i, elem) {
				var value = $(this).text().replace(/[^a-z0-9\s]/gi, ' ').replace('entree', '').replace('main', '').replace('soups','').replace('sides','').replace('breakfast','').trim();
				
				if(value.length > 0)
				{
					$(this).addClass('needparse');
					$(this).addClass('food');
				}
			});
			
			$('h4').each(function(i, elem) {
				if($(this).text().replace(/[\n\r\t]/g, "").trim())
				{
					$(this).addClass('needparse');
					$(this).addClass('date');
				}
			});
			
			$('h5').each(function(i, elem) {
				if($(this).text().replace(/[\n\r\t]/g, "").trim())
				{
					$(this).addClass('needparse');
					
					if($(this).text().trim().startsWith("Breakfast") || $(this).text().trim().startsWith("Lunch"))
					{
						$(this).addClass('meal');
					}
				}
			});
			
			var activeMeal = 0;
			var isFirst = 1;
			var payload = [];
			var item = {date:'',menu:{breakfast:[],lunch:[]}};
			
			$('.needparse').each(function(i, elem) {
				if($(this).hasClass('meal'))
				{
					var value = $(this).text().replace(/[\n\r\t]/g, "");
					
					if(value.trim().startsWith('Breakfast'))
					{
						activeMeal = 0;
					}
					else if(value.trim().startsWith('Lunch'))
					{
						activeMeal = 1;
					}
					
					//console.log("==============MEAL============ " + value);
				}
				else if($(this).hasClass('date'))
				{
					var value = $(this).text().replace(/[\n\r\t]/g, "");
			
					if(isFirst == 0)
					{
						payload.push(item);
						item = {date:'',menu:{breakfast:[],lunch:[]}};
						
					}			
					isFirst = 0;
					item.date = value;

					//console.log("###############DATE###############" + value);
				}
				else
				{
					var value = $(this).text().replace(/[\n\r\t]/g, ' ').trim().replace(/[^a-z0-9\s]/gi, ' ').replace('entree', '').replace('main', '').replace('soups','').replace('sides','').replace('breakfast','').trim();
					
					if(value.length > 0)
					{
						if(activeMeal == 0)
						{
							item.menu.breakfast.push(value);
						}
						else if(activeMeal == 1)
						{
							item.menu.lunch.push(value);
						}
						//console.log("Food " + value);
					}
				}
			});
			payload.push(item);
			
			return response.send(payload);
		}
	
		return response.send("Whoops!");
	});
});

app.get('/tester', function(request, response) {
  var date = new Date();
  date.setDate(date.getDate() + 1);
  
  response.send(date.getDay().toString());
    
});

app.post('/', function(request, response) {
	
	var date = request.body.result.parameters.date;
	var meal = request.body.result.parameters.meal;
	
	if(date == "today" || date == "tomorrow")
		date = NormalizeDay(date);
	
	var myCallback = function(data) {
		var value = "We are having Soylent, sorry.";
		if(date == 'Saturday' || date == 'Sunday')
		{
			value = "It's the weekend. Cook your own food.";
		}
		else
		{
			for(var i = 0; i < data.length; i++)
			{
				if(data[i].date.toLowerCase().startsWith(date.toLowerCase()))
				{
					if(meal == 'breakfast')
						value = "We are having "+ data[i].menu.breakfast.join(", ") +" on " + date + ".";
					else if(meal == 'lunch')
						value = "We are having "+ data[i].menu.lunch.join(", ") +" on " + date + ".";
				}
			}
		}
		
		var apiResponse = {
			speech: value,
			displayText: value,
			data: {},
			contextOut: [],
			source: 'rakuten-chef'
		};
		
		response.send(apiResponse);
	};
	
	requester({method: 'GET', uri: 'http://rakuten-chef.herokuapp.com/json', json: true},function (error, res, body) {
		if (!error && res.statusCode == 200) {
			myCallback(body);
		}
	});
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

	
