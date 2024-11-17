// import * as Mastodon from 'tsl-mastodon-api';
// const mastodon = new Mastodon.API({access_token: 'PRZhmwmS5fpkXo442UE8SGHv8TL7XOiqjhpOh49heb0', api_url: 'https://mastodon.social/api/v1/'}); // access the Mastodon API using the access token.
import axios from 'axios';

export default async function getPostText() 
{	
	const response = await axios.get('https://syndication.twitter.com/srv/timeline-profile/screen-name/mapleleafs');

	const html = response["data"];

	const start_str = '<script id="__NEXT_DATA__" type="application/json">'
	const end_str = '</script></body></html>'

	const start_index = html.indexOf(start_str) + start_str.length;
	const end_index = html.indexOf(end_str, start_index);

	const content = html.slice(start_index, end_index);
	const objJSON = JSON.parse(content)["props"]["pageProps"]["timeline"]["entries"];

	var stringArr = [];
	var urlArr = [];
	var altTextArr = [];
	var cardArr = [];

	// TODO: replace i < 1 with objJSON.length when post check stops failing
	// for now manually pushing just the latest post 
	for (let i = 0; i < 1; i++) {
		var postUrlArr = [];
		var postAltTextArr = [];
		
		const tweetMedia = objJSON[i]["content"]["tweet"]["entities"]["media"];

		for (let j = 0; j < 4; j++) {
			if (tweetMedia[j] != undefined) {
				const type = tweetMedia[j]["type"];
				
				// retrieve media url
				if (type == "video") {
					var videoUrl = tweetMedia[j]["video_info"]["variants"][3]["url"];
					const sliceIndex = videoUrl.indexOf('mp4');
					videoUrl = videoUrl.slice(0, sliceIndex+3);
					postUrlArr.push(videoUrl);
				} else if (type == 'photo' || type == 'gifv') {
					// TODO: haven't seen a post with a gif yet so this is a guess for gifv
					postUrlArr.push(tweetMedia[j]["media_url_https"]);
				} else {
					postUrlArr.push("None");
				}

				// retrieves media alt text
				if (type == 'video') {
					const width = tweetMedia[j]["original_info"]["width"];
					const height = tweetMedia[j]["original_info"]["height"];
					const duration = tweetMedia[j]["video_info"]["duration_millis"] / 1000;
					const previewUrl = tweetMedia[j]["media_url_https"];

					postAltTextArr.push(`${width}@#*${height}@#*${duration}@#*${previewUrl}`);
				} else { // no description param for non-videos
					postAltTextArr.push("None");
				}
			} else {
				postUrlArr.push("None");
	 			postAltTextArr.push("None");
			}
		}

		var postUrl = postUrlArr.join("!^&");
		var postAltText = postAltTextArr.join("!^&");
		urlArr.push(postUrl);
		altTextArr.push(postAltText);
		
		// retrieves tweet text
		var contentJSON = objJSON[i]["content"]["tweet"]["full_text"];
		// for retweets retrieves text only b/c there are no url params
		if (contentJSON.slice(0,2) == 'RT') {
			contentJSON = 'RT @' + objJSON[i]["content"]["tweet"]["retweeted_status"]["user"]["screen_name"] + ": " + objJSON[i]["content"]["tweet"]["retweeted_status"]["full_text"];
		}
		var contentString = JSON.stringify(contentJSON);

		const tweetLink = /(?<![: ])([\s]*[\|]*[\s]*https:\/\/t\.co\/[a-zA-Z0-9]+)/gi;
		const newLine = new RegExp("\\\\n", "g");
		const ampersand = new RegExp("&amp;", "g");
		
		contentString = contentString.slice(1, -2); // removes quotes around the string
		contentString = contentString.replace(tweetLink, ""); // removes tweet link 
		contentString = contentString.replace(newLine, "\n");
		contentString = contentString.replace(ampersand, '&');

		// TODO: fix if there's a card paramter
		cardArr.push("None");
		stringArr.push(contentString);
	}

	var urls = urlArr.join("@#%");
	var strings = stringArr.join("@#%"); // Turn the string array into a single string by joining them with a \/ delimiter. This will be undone when used by bot functions. 
	var alts = altTextArr.join("@#%"); 
	var cards = cardArr.join("@#%");
	var urlsStringsAltsCardsArr = [urls, strings, alts, cards];
	var urlsStringsAltsCards = urlsStringsAltsCardsArr.join("~~~");

	return urlsStringsAltsCards; // Return this singular concatenated string. 
}
