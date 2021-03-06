function narrate(utterance, callback) {
	chrome.tts.speak(
		utterance, 
		{ 
			onEvent: function(ttsEvent) {
				if(ttsEvent.type == "error") { console.error("TTS Error:", ttsEvent); }
			},
			'enqueue': true,
			'gender': 'female'
		},
		function() {
			if(chrome.runtime.lastError !== undefined) { 
				console.error("Runtime error:", chrome.runtime.lastError.message); 
			}
			callback && callback();
		}
	);
}