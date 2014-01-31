var db = [];
var myInfinity = 10000000000;
var lastReadId = '---';
var readQueue = [];
var audible = "beep";
var filterList = [];





function getTweets() {                          


	var tweet = document.evaluate('//li[contains(string(@class),"js-stream-item")]', document, null, XPathResult.ANY_TYPE, null);
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

function getFilter(){
	chrome.runtime.sendMessage({getFilter: 'filter' }, function(response) {
	  filterList = response.filter;
	  console.log('filter in client side');
	  console.log(filterList);
	});
}





function processNewTweets(latestId,lastReadId){
	var tweets = getTweets();
	var newTweets = 0;
	var seenTheId = false;
	  for(var i = tweets.length-1; i >= 0; i--) {
		 var cId = tweets[i]['text'];
		 if(cId == lastReadId ){
		 	seenTheId = true;
		 	continue;
		 }
		 if(seenTheId == true){
		 	readQueue.push(tweets[i]);
		 }
	  };
	  if(seenTheId == false){
	  	var latestId = getLatestTweet()['text'];
	  	setLastRead(latestId);
	  }else{
		passReadQueue();
	}
	

}

function infilter(text){
	console.log("infilter - "+ text);
	var result = false;
	console.log("filterlist length" + filterList.length);
	if(filterList.length == 0) result =  true;
	if(filterList[0] == '') result = true;
	
	filterList.forEach(function(filter) {
    	console.log(filter);
    	if(text.toLowerCase().indexOf(filter.trim().toLowerCase() ) >= 0){
    		console.log('filter found ' + filter);
    		result = true;
    	}
	});
	
	return result;

}

function startThis(){
	// var tweetss = getTweets();
	var latestId = getLatestTweet()['text'];
	

	

	if(latestId !== lastReadId && infilter(latestId) == true){
		if(lastReadId == '---'){
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


	
}



function PlaySound() {
    
    var html = '<audio id="audio1" src="beep-1.wav" style="display:block;" controls="show" preload="auto" autobuffer></audio>';
    var audio = document.createElement("audio");
    //http://www.soundjay.com/button/beep-06.wav
	audio.src = "http://www.soundjay.com/button/button-09.wav";
	document.body.appendChild(audio);

    audio.play();
  }


function init(){
	getFilter();
	getTweetorBeep();
	getLastRead();
}



init();