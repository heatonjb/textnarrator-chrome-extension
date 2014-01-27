var db = [];
var myInfinity = 10000000000;
var lastReadId = '---';
var readQueue = [];
var audible = "beep";


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







function getLatestTweet(){
	var tweets = getTweets();
	return tweets[0];
}

function getLastRead(){
	chrome.runtime.sendMessage({getlastread: "id"}, function(response) {
	  lastReadId = response.lastread;
	  startThis();
	});
}

function setLastRead(id){
	console.log('setLastRead to- '+ id);
	chrome.runtime.sendMessage({setlastread: id }, function(response) {
	});
}

function readTweet(tweet){
	chrome.runtime.sendMessage({readTweet: tweet }, function(response) {
	});
}

function readOut(msg){
	chrome.runtime.sendMessage({read: msg }, function(response) {
	  //
	});
}

function passReadQueue(){
	chrome.runtime.sendMessage({passReadQueue: readQueue }, function(response) {
	  //
	});
}

function getTweetorBeep(){
	chrome.runtime.sendMessage({tweetorbeep: 'tweetorbeep' }, function(response) {
	  audible = response.tweetorbeep;
	});
}


function processNewTweets(latestId,lastReadId){
	console.log('processNewTweets');
	var tweets = getTweets();
	var newTweets = 0;
	var seenTheId = false;
	console.log("total tweets to process = " + tweets.length);
	  for(var i = tweets.length-1; i >= 0; i--) {
		 console.log(tweets[i]['id'] + " - " +  tweets[i]['text']);
		 var cId = tweets[i]['text'];
		 if(cId == lastReadId ){
		 	seenTheId = true;
		 	continue;
		 }
		 if(seenTheId == true){
		 	readQueue.push(tweets[i]);
		 }
	  };

	//readOut(readQueue.length + " " + " new tweets");
	console.log('read Queue length = '+ readQueue.length);
	passReadQueue();
	//setLastRead(getLatestTweet()['id']);
	//read all tweets only allow reload on complete
	//read num new tweets or beeep

}

function startThis(){
	// var tweetss = getTweets();
	var latestId = getLatestTweet()['text'];
	

	console.log("latestid = "+ latestId);
	console.log("lastReadId = "+ lastReadId);

	if(latestId !== lastReadId){
		console.log('new tweets so do something');
		if(lastReadId == 0){
			setLastRead(latestId);
		}else{
			if(audible == 'beep'){
				PlaySound();
				setLastRead(getLatestTweet()['text']);
			}else{
				processNewTweets(latestId,lastReadId);
			}
		}

	}else{
		console.log("NO NEW TWEETS DO NOTHING");
	}

	//setLastRead();
	
}



function PlaySound() {
    
     var html = '<audio id="audio1" src="beep-1.wav" style="display:block;" controls="show" preload="auto" autobuffer></audio>';
   // var el1 = document.createElement('<div></div>');
   //  document.getElementById("doc").appendChild(el1);

 
    var audio = document.createElement("audio");
	audio.src = "http://tweet-out.com/static/beep-027.wav";
	document.body.appendChild(audio);

    audio.play();
  }


function init(){
	getTweetorBeep();
	getLastRead();
}

// Get saved last tweet id from ext... if null then get the newest tweet id and save it and exit.
// Loop through all tweets from oldest bottom first
// if


init();