var bkg = chrome.extension.getBackgroundPage();

function restoreOptions() {
        var port = chrome.extension.connect({name: "findReloadTime"});
        port.onMessage.addListener(recvData);
        port.postMessage({msg:'getReloadTime'});
    }

    function recvData(data){
        if (data.is_random) {
            document.reload_options.reloadOption[9].checked = true;        
        } else {
            var reloadTime = data.ms_between_load;
            for( i = 0; i < document.reload_options.reloadOption.length; i++ ) {
                if(document.reload_options.reloadOption[i].value == reloadTime) {
                    document.reload_options.reloadOption[i].checked = true;
                    return;
                }
            }
            // If we got this far, the value is not on the radio buttons
            document.getElementById('freeForm').checked = true;
            document.reload_options.reloadOptionSeconds.value = Math.floor(reloadTime / 1000) /* milliseconds -> seconds */;
        }
    }


    function setReloader() {
    	bkg.console.log('setting reloader');
        var option = 0;
        var isRandom = false;
 
        for( i = 0; i < document.reload_options.reloadOption.length; i++ ) {
            if( document.reload_options.reloadOption[i].checked == true ) {
                if ('rand' == document.reload_options.reloadOption[i].value) {
                    option = Math.floor(Math.random()*1800000);
                    isRandom = true;
                } else {
                    option = document.reload_options.reloadOption[i].value;                
                } 
                break;
            }
        }
        
    	// Free-form input overrides the radios
    	if (document.getElementById('freeForm').checked == true) {
    	    if (document.reload_options.reloadOptionSeconds.value > 0) {
        		option = document.reload_options.reloadOptionSeconds.value * 1000 /* seconds -> milliseconds */;
    	    } else {
        		// Reset the value
        		option = 0;
    	    }
    	}

    	var speak = false;
    	if (document.getElementById('readText').checked == true) {
    		speak = true;
    	}

    	var filter = document.getElementById('filter').value;
    	
        
        
        var views = chrome.extension.getViews();
        for (var i in views) {
            if (views[i].doReloader) {
                views[i].doReloader(option, isRandom,speak, filter);
            }
        }

        window.close();
        
        return true;  // We use this function in onSubmit; probably not necessary
    }



function setTime(){
	bkg.console.log('setTime');
	var option = 0;
	var speak = false;
        var isRandom = false;
 
        for( i = 0; i < document.reload_options.reloadOption.length; i++ ) {
            if( document.reload_options.reloadOption[i].checked == true ) {
            
                    option = document.reload_options.reloadOption[i].value;  
                    bkg.console.log('reloading '+ option);              
                	break;
            }
        }


        
    	// Free-form input overrides the radios
    	if (document.getElementById('freeForm').checked == true) {
    	    if (document.reload_options.reloadOptionSeconds.value > 0) {
        		option = document.reload_options.reloadOptionSeconds.value * 1000 /* seconds -> milliseconds */;
    	    } else {
        		// Reset the value
        		option = 0;
    	    }
    	}

    	if (document.getElementById('readText').checked == true) {
    		speak = true;
    	}

    	var filter = document.getElementById('filter').value;
    	
		bkg.console.log('filter = ' + filter);        
        
        var views = chrome.extension.getViews();
        for (var i in views) {
            if (views[i].doReloader) {
            	// bkg.console.log('calling reloader';      
                views[i].doReloader(option, isRandom,speak,filter);
            }
        }
}   


function Init() {
	var paused = false;

	


	var Render = function() {
		// document.getElementById("pauseresume_img").src = chrome.extension.getURL(paused ? "img/play32.png" : "img/pause32.png");
	};

	
	

	// document.getElementById("reloadStart").addEventListener("click", function(e) { 
	// 	bkg.console.log('reloadStart');
	// 	var views = chrome.extension.getViews();
 //        for (var i in views) {
 //        	bkg.console.log(i);
 //        	views[i].doReloader(option, isRandom);
 //            if (views[i].doReloader) {
 //            	bkg.console.log('doReloader x');
 //                views[i].doReloader(option, isRandom);
 //            }
 //        }
 //        bkg.console.log('reloadStart end');
 //        window.close();
	// });



	document.getElementById("reload0").addEventListener("click", function(e) { 
		setTime();
	});

	document.getElementById("reload5").addEventListener("click", function(e) { 
		setTime();
	});

	document.getElementById("reload15").addEventListener("click", function(e) { 
		setTime();
	});

	document.getElementById("reload30").addEventListener("click", function(e) { 
		setTime();
	});

	document.getElementById("reload60").addEventListener("click", function(e) { 
		setTime();
	});
	document.getElementById("reloadMisc").addEventListener("change", function(e) { 
		setTime();
	});
	document.getElementById("freeForm").addEventListener("click", function(e) { 
		setTime();
	});

	

	// document.getElementById("narrate").addEventListener("click", function(e) { 
	// 	chrome.tabs.query({ active: true }, function(tabs) {
	// 		tabs.forEach(function(tab) {
	// 			chrome.tabs.executeScript(tab.id, {file: "content_script.narrator.js" }, function(results) {
	// 				if(results && results.every(function(o) { return o; })) {
	// 					chrome.tabs.sendMessage(tab.id, { command: "getSelectionUtterance" });
	// 				}
	// 			});
	// 		});
	// 	});
	// });


	
	document.getElementById("play").addEventListener("click", function(e) { 
		chrome.tts.resume();
		bkg.console.log("Resumed.");
		setTime();
	});

	document.getElementById("pause").addEventListener("click", function(e) { 
		bkg.console.log("Paused.");
		chrome.tts.pause();
	});

	document.getElementById("stop").addEventListener("click", function(e) { 
		bkg.console.log("stop.");
		chrome.tts.stop();
	});
	
	// document.getElementById("pauseresume").addEventListener("click", function(e) { 
		
	// 	chrome.tts.isSpeaking(function(isSpeaking) {
	// 		bkg.console.log("Chrome TTS: " + (isSpeaking ? "is speaking" : "is not speaking"));
	// 		if(isSpeaking && !paused) {
	// 			chrome.tts.pause();
	// 			paused = true; 
	// 			bkg.console.log("Paused.");
	// 		} else {
	// 			chrome.tts.resume();
	// 			paused = false;
	// 			bkg.console.log("Resumed.");
	// 		}			
	// 		Render();
	// 	});
	// });




	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.utterance) {
		  narrate(request.utterance, function() { sendResponse("Narrate: OK"); });
		}
		Render();
	});
	
	Render();



	bkg.console.log("INit popup.js");
}



document.addEventListener("DOMContentLoaded", Init);