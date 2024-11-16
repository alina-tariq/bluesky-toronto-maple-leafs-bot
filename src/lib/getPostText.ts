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

	for (let i = 0; i < objJSON.length; i++) {
		var postUrlArr = [];
		var postAltTextArr = [];
		
		const tweetMedia = objJSON[i]["content"]["tweet"]["entities"]["media"];

		for (let j = 0; j < 4; j++) {
			if (tweetMedia[j] != undefined) {
				const type = tweetMedia[j]["type"];

				// retrieve media url
				if (type == "video") {
					postUrlArr.push(tweetMedia[j]["video_info"]["variants"][3]["url"]);
				} else if (type == 'photo' || type == 'gifv') {
					postUrlArr.push(tweetMedia[j]["media_url_https"]);
				} else {
					postUrlArr.push("None");
				}

				// retrieves media alt text
				// TODO: potentially fix
				if (type == "video") {
					tweetMedia[j]["additional_media_info"]["description"] == undefined || tweetMedia[j]["additional_media_info"]["description"] == ''
						? postAltTextArr.push("None")
						: postAltTextArr.push(tweetMedia[j]["additional_media_info"]["description"]);
				} else {
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

		const contentJSON = objJSON[i]["content"]["tweet"]["full_text"];
		var contentString = JSON.stringify(contentJSON);
		const tweetLink = new RegExp(" https://t.co/[A-Za-z0-9]+", "g");
		contentString = contentString.replace(tweetLink, "'");

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
