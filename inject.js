var db = [];
var myInfinity = 10000000000;
var lastReadId = 0;
var readQueue = [];


function getUsers () {

	var user = document.evaluate("//span[@class='username js-action-profile-name']/b", document, null, XPathResult.ANY_TYPE, null);
	var iterator = user.iterateNext();

	var users = [];

	while(iterator) {
		users.push(iterator.textContent);
		iterator = user.iterateNext();
	}

	return users;
}

function getTimes () {
									
	var time = document.evaluate("//span[@class='_timestamp js-short-timestamp js-relative-timestamp']/b", document, null, XPathResult.ANY_TYPE, null);
	var iterator = time.iterateNext();

	var times = [];

	while(iterator) {
		times.push(iterator.textContent);
		iterator = time.iterateNext();
	}

	return times;
}


function getTweets() {
	console.log("getTweets");
	var tweet = document.evaluate("//li[@class='js-stream-item stream-item stream-item expanding-stream-item']", document, null, XPathResult.ANY_TYPE, null);
	var iterator = tweet.iterateNext();

	var tweets = [];


	while (iterator) {
		var tid = iterator.getAttribute('data-item-id')
		var ttext = iterator.getElementsByClassName('tweet-text')[0].textContent;
		tweets.push({'id':tid,'text':ttext});
		iterator = tweet.iterateNext();
	}

	return tweets;
}




function tweetsCounter() {
	var tweets = getTweets();
	var tweetsLength = tweets.length;

	return tweetsLength;
}


function startScraping(tweetsAmount) {
	var tweets = getTweets();
	var users = getUsers();
	var times = getTimes();

	var tweetsLength = tweets.length;

	for(var i = 0; i <= tweetsAmount - 1; i++) {
		var item = {"User": users[i],"Time": times[i], "Tweet": tweets[i]};
		db.push(item);
	};

	var json_text = JSON.stringify(db, null, 2);
	console.log(json_text);
	console.log("END SCRAPING NOW>>>>....");
}


function scrollBottom(tweetsAmount) {
	console.log("scrollBottom....");
	setInterval(function timeOut() {
		var tweetsLength = tweetsCounter();
		document.body.scrollTop = myInfinity;
		
		if (tweetsLength < tweetsAmount) {
			scrollBottom(tweetsAmount);
		}
		else {
			startScraping(tweetsAmount);		
		}

	}, 9000);
}

function getLatestTweet(){
	var tweets = getTweets();
	console.log(tweets.length);
	 // for(var i = tweets.length-1; i >= 0; i--) {
		// console.log(tweets[i]);
		// console.log(i);
	 // };
	return tweets[0];
}

function getLastRead(){
	console.log('getlastread');
	chrome.runtime.sendMessage({getlastread: "id"}, function(response) {
	  console.log("lastread repsponse = " + response.lastread);
	  lastReadId = response.lastread;
	  startThis();
	});
}

function setLastRead(id){
	console.log('setLastRead to- '+ id);
	
	chrome.runtime.sendMessage({setlastread: id }, function(response) {
	  console.log('updated - '  + response.lastread);
	});
}

function readTweet(tweet){
	chrome.runtime.sendMessage({readTweet: tweet }, function(response) {
	  console.log('readTweet added count = '  + response.readQueueLength);
	});
}

function readOut(msg){
	chrome.runtime.sendMessage({read: msg }, function(response) {
	  //
	});
}


function processNewTweets(latestId,lastReadId){
	console.log('processNewTweets');
	var tweets = getTweets();
	var newTweets = 0;
	console.log("total tweets to process = " + tweets.length);
	  for(var i = tweets.length-1; i >= 0; i--) {
		 console.log(tweets[i]['id'] + " - " +  tweets[i]['text']);
		 var cId = parseInt(tweets[i]['id']);
		 if(cId > lastReadId ){
		 	readQueue.push(tweets[i]);
		 }
	  };

	readOut(readQueue.length + " " + " new tweets");
	console.log('read Queue length = '+ readQueue.length);
	//read all tweets only allow reload on complete
	//read num new tweets or beeep

}

function startThis(){
	console.log('statthis inject.js');
	// var tweetss = getTweets();
	var latestId = parseInt(getLatestTweet()['id']);
	

	console.log("latestid = "+ latestId);
	console.log("lastReadId = "+ lastReadId);

	if(latestId > lastReadId){
		console.log('new tweets so do something');
		if(lastReadId == 0){
			setLastRead(latestId);
		}else{
			processNewTweets(latestId,lastReadId);
		}

	}else{
		console.log("NO NEW TWEETS DO NOTHING");
	}

	//setLastRead();
	
}

function init(){
	getLastRead();
}

// Get saved last tweet id from ext... if null then get the newest tweet id and save it and exit.
// Loop through all tweets from oldest bottom first
// if

console.log('injected');
init();