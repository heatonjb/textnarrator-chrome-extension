var lastTweetRead = '---';
var readQueue = [];
var speak = false;
var speaking = false;
var filterlist = [];



var tabStorage = [];
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.cmd == "save") {
        tabStorage[sender.tab.id] = request.data;
    }

    if(request.cmd == "load") {
        sendResponse(tabStorage[sender.tab.id]);
    }
});
	
	 
//  RELOADER JS

 var tabs = new Array();

    chrome.extension.onConnect.addListener(function(port) {
        if (port.name === 'findReloadTime') {
            port.onMessage.addListener(function(data) {
                if (data.msg === 'getReloadTime') {
                    chrome.tabs.getSelected(null, function(tab) {
                        var tabIsReloaderActive = tabs[tab.id] || false;
                        if (tabIsReloaderActive) {
                            port.postMessage({ms_between_load:tabs[tab.id].ms_between_load, is_random:tabs[tab.id].is_random});
                        }
                    });
                }
            });
        }

    });
    

    function executeJSScript (tab) {
		chrome.tabs.executeScript(tab, {file: "inject.js"}	);	
	}


    function doReloader(time, isRandom,speakit,filter) {
    	speak = speakit;
        filterlist = filter.split(',');
        // console.log('doreloader');
        // console.log(filterlist);        
        
        if (time > 0) {
            chrome.tabs.getSelected(null, function(tab) {

                if (tabs[tab.id] || false) {
                    // if there is already a reloader setup for this tab, cancel it
                    cancelReload(tab.id);
                }
                
                tabs[tab.id] = new Array();
                tabs[tab.id]['action_url'] = tab.url;
                tabs[tab.id]['ms_between_load'] = time;
                tabs[tab.id]['seconds_to_next_reload'] = time/1000;
                tabs[tab.id]['is_random'] = isRandom;

                chrome.tabs.onUpdated.addListener(onUpdateListener);

                chrome.browserAction.setIcon({path:"ios7-play-outline.png", tabId:tab.id});

                // reload the page
                // timers are set for the next reload (and a display timer) in the page load listener
                doReload(tab.id);
            });

        } else {
            chrome.tabs.getSelected(null, function(tab) {
                cancelReload(tab.id);
            });
        }
    }

    function onUpdateListener(tabId, changeInfo) {
        // Hide the badge text
        chrome.browserAction.setBadgeText({text:'', tabId:tabId});
      
        var tabIsReloaderActive = (tabs[tabId] || false) && (tabs[tabId].ms_between_load > 0 || false);        
        if (tabIsReloaderActive) {
            // can only get the URL infomation when the page is loading, not when it is complete
            if (changeInfo['status'] === 'loading') {
                // we want to cancel the reloader if they navigate away
                var urlChanged=changeInfo['url'] || false;
                if (urlChanged) {
                    // the URL has changed - presumably by navigation
                    // cancel the reloads
                    cancelReload(tabId);
                } else {
                    // reset the icon (it is cleared when reloaded)
                    chrome.browserAction.setIcon({path:"/img/tweet128.png", tabId:tabId}); // the icon is reset when the page is reloaded


                    // Cancel the timer display while the tab is reloading
                    cancelDisplayTimer(tabId);

                    // Cancel the reload time (in case the user manually reloaded the page)
                    if (tabs[tabId].reloadTimer || false) {
                        clearTimeout(tabs[tabId].reloadTimer);
                        tabs[tabId].reloadTimer = null;
                    }
                }
            } else if (changeInfo['status'] === 'complete') {
                // page has just completed loading

                // reset the icon (it is cleared when reloaded)
                chrome.browserAction.setIcon({path:"/img/tweet128.png", tabId:tabId}); // the icon is reset when the page is reloaded

                // if we are using random timouts then we need to reset the time related variables here
                if (tabs[tabId]['is_random']) {
                    var time = Math.floor(Math.random()*1800000);
                    tabs[tabId].ms_between_load = time;
                                
                }

                // reset the timer for the countdown
                tabs[tabId].seconds_to_next_reload = tabs[tabId].ms_between_load/1000;


                
                // and set the correct countdown text
                setBadgeText(tabId);

                // set a timeout for the next reload
                setupReloadTimer(tabId);

                // make really sure this timeout is cancelled before we add a new one
                cancelDisplayTimer(tabId);

                // setup the reload countdown
                tabs[tabId].displayTimer = window.setInterval(function(tab_id) {
                        tabs[tab_id].seconds_to_next_reload--;
                        setBadgeText(tab_id);
                    }, 1000, tabId);

                //inject js
                


            }
        }

        

    }

    function setupReloadTimer(tabId) {
        // be sure to remove any reload timer before we add a new one
        if (tabs[tabId].reloadTimer || false) {
            clearTimeout(tabs[tabId].reloadTimer);
            tabs[tabId].reloadTimer = null;
        }

        // set the reload to occur in ms_between_load milliseconds time
        tabs[tabId].reloadTimer = window.setTimeout(function(tab_id) {
                doReload(tab_id);
            }, tabs[tabId].ms_between_load, tabId);
    }

    function cancelDisplayTimer(tabId) {
        if (tabs[tabId].displayTimer || false) {
            clearTimeout(tabs[tabId].displayTimer);
            tabs[tabId].displayTimer = null;
        }
    }

    function setBadgeText(tab_id) {
        //chrome.browserAction.setBadgeText({text:'p1', tabId:tab_id});
    
        if (tabs[tab_id].seconds_to_next_reload < 0) {
            // something is wrong! Don't display any text
            chrome.browserAction.setBadgeText({text:String(), tabId:tab_id});
            // cancel the time which is calling this. It will get recreated if the page is auto-reloaded
            cancelDisplayTimer(tab_id);
        } else {
            var badgeText = String(tabs[tab_id].seconds_to_next_reload);

            //var mins = Math.floor(tabs[tab_id].seconds_to_next_reload/60);
            var secs = tabs[tab_id].seconds_to_next_reload%60;
            //if (secs < 10) {
            //    secs = '0' + String(secs);
            //}            
            //badgeText= String(mins) + ':' + String(secs);
            
            var mins = Math.floor((tabs[tab_id].seconds_to_next_reload/60)%60);
            var hours = Math.floor((tabs[tab_id].seconds_to_next_reload/(60*60))%24);
            var days = Math.floor((tabs[tab_id].seconds_to_next_reload/(60*60*24)));

    	    // Format
    	    // The banner fits about 4.5 characters (depending on the character's width)
    	    if (days > 999) {
        		badgeText = 'long'; // it will take long...
    	    } else if (days > 9) {
        		badgeText = String(days) + 'd';
    	    } else if (days > 0) {
        		// The 'h' will not entirely fit on the banner all the time.  Live with it.
        		badgeText = String(days) + 'd' + String(hours) + 'h';
    	    } else if (hours > 0) {
        		if (mins < 10) {
        		    mins = '0' + String(mins);
        		}
        		// Blinking ':'
        		// Note: The banner uses a variable-width font; both strings have to have the same width
    		if (secs % 2) {
    		    var blinker = ':';
    		} else {
    		    var blinker = ' ';
    		}
    		badgeText = String(hours) + blinker + String(mins);
    	    } else {
            		if (secs < 10) {
            		    secs = '0' + String(secs);
        		}
        		badgeText = String(mins) + ':' + String(secs);
    	    }
            
            chrome.browserAction.setBadgeText({text:badgeText, tabId:tab_id});
        }


    }

    function cancelReload(tab_id) {
        if (tabs[tab_id].reloadTimer || false) {
            clearTimeout(tabs[tab_id].reloadTimer);
            tabs[tab_id].reloadTimer = null;
        }
        if (tabs[tab_id].displayTimer || false) {
            clearTimeout(tabs[tab_id].displayTimer);
            tabs[tab_id].displayTimer = null;
        }
        tabs[tab_id].ms_between_load = 0;
        tabs[tab_id].seconds_to_next_reload = 0;
        chrome.browserAction.setIcon({path:"/img/tweet128.png", tabId:tab_id});
        chrome.browserAction.setBadgeText({text:String(), tabId:tab_id});

    }

    function doReload(tab_id) {


    	if(speaking == false){
	        chrome.browserAction.setIcon({path:"/img/tweet128.png", tabId:tab_id});
	        chrome.browserAction.setBadgeText({text:'', tabId:tab_id});

	        // need to work out a way to make POST'ed pages reload
	        chrome.tabs.update(tab_id, {url: tabs[tab_id].action_url});
	        //chrome.tabs.executeScript(tab_id, {code: 'window.location.reload()'});

	        executeJSScript(tab_id);
    	}else{
    		// reset the timer for the countdown
                tabs[tab_id].seconds_to_next_reload = tabs[tab_id].ms_between_load/1000;


                
                // and set the correct countdown text
                setBadgeText(tab_id);

                // set a timeout for the next reload
                setupReloadTimer(tab_id);

                // make really sure this timeout is cancelled before we add a new one
                cancelDisplayTimer(tab_id);

                // setup the reload countdown
                tabs[tab_id].displayTimer = window.setInterval(function(tab_id) {
                        tabs[tab_id].seconds_to_next_reload--;
                        setBadgeText(tab_id);
                    }, 1000, tab_id);
    	}

    }

    function stripStuff(str){
        rex = /(<a href=")?(?:https?:\/\/)?(?:\S+\.)+\S+/g;        
        str2 = str.replace( rex, '' );
        rex2 = /(\/\w+)+/gi ;   
        str3 = str2.replace( rex2, '' );
        return str3;
    }

    function readTweetQueue(){
    	if(readQueue.length < 1){
    		return;
    	}else{
    		var tweet = readQueue.pop();
            lastTweetRead = tweet['text'];
    		narrate(stripStuff(tweet['text']),readTweetQueue());
    	}
    }

    chrome.runtime.onMessage.addListener(
	  function(request, sender, sendResponse) {
	   	
	    if (typeof request.setlastread != 'undefined')
	    {
	    	lastTweetRead = request.setlastread;
	    	sendResponse({lastread: lastTweetRead });
	    }
	    if (typeof request.getlastread != 'undefined') 
	    {
	      	sendResponse({lastread: lastTweetRead });
	  	}
	  	if (typeof request.readTweet != 'undefined') 
	    {
	      	readQueue.push(readTweet);
	      	sendResponse({readQueueLength: readQueue.length });
	  	}
	  	if (typeof request.read != 'undefined') 
	    {	
	      	 narrate(request.read);
	  	}
        if (typeof request.tweetorbeep != 'undefined') 
        {   
             
            if(speak == false){
                var audible = 'beep';
             }else{
                var audible = 'speak';
             }
             
             sendResponse({tweetorbeep: audible });
        }

        if (typeof request.getFilter != 'undefined') 
        {   
             sendResponse({filter: filterlist });
        }
        
	  	if (typeof request.passReadQueue != 'undefined') 
	    {	
	      	 speaking = true;
	      	 if(speak == false){
	      	 	narrate(passReadQueue.length + " New Tweets");
	      	 }else{
	      	 	readQueue = request.passReadQueue;
	      	 	readTweetQueue();
	      	 }
	      	 speaking = false;
	      	 sendResponse();
	  	}
	  	
	  });

    

