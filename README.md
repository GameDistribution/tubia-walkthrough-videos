[![npm](https://img.shields.io/npm/v/npm.svg)](https://nodejs.org/)
[![GitHub version](https://img.shields.io/badge/version-0.0.9-blue.svg)](https://github.com/GameDistribution/tubia-walkthrough-videos/)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.svg)](http://gruntjs.com/)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/GameDistribution/tubia-walkthrough-videos/blob/master/LICENSE)


# Tubia walkthrough video's
This is the documentation of the Tubia video player project. An HTML5 player used for displaying gaming walkthrough video's matching its context.

Tubia.com offers walkthrough video’s to gaming publishers, for free. Many gamers seek out helpful tutorials and videos to help them when they get stuck in a game. We facilitate this and create helpful content that helps gamers beat their favorite web games! By embedding our video walkthroughs on your website, you can not only help your users beat a difficult part of a game, but also increase your revenue and user engagement.

Running into any issues? Check out the Wiki of the github repository before mailing to <a href="support@tubia.com" target="_blank">support@tubia.com</a>

## Implementation within a page
The player should be implemented within a page by embedding it within a simple iframe or as web component. Specific information of the player features and usages can be found at the <a href="https://github.com/GameDistribution/tubia-walkthrough-videos/wiki" target="_blank">wiki</a>.

### Embed as <iframe>
It is also possible to embed the Tubia video player within a simple <iframe> element. However, you won't be able to hook into the callbacks.
```
<iframe 
    scrolling="no" 
    frameborder="0" 
    allowfullscreen="allowfullscreen" 
    style="margin: 0px; padding: 0px;" width="640" height="480" 
    src="https://player.tubia.com/?publisherid=[YOUR PUBLISHER ID HERE]&gameid=[YOUR GAME ITS IDENTIFIER]&pageurl=[CURRENT PAGE URL ENCODED]&title=[YOUR GAME ITS URL ENCODED TITLE]&colormain=[PLAYER THEME HEX COLOR CODE]&coloraccent=[PLAYER THEME HEX COLOR CODE]&gdprtracking=[SET BY YOUR GDPR SOLUTION]&gdprtargeting=[SET BY YOUR GDPR SOLUTION]&langcode=[LANGUAGE CODE - REGION CODE]">
</iframe>
```
Use the following query variables.

| Property | Mandatory | Default | Description |
| --- | --- | --- | --- |
| publisherid | Yes | '' | Your Tubia publisher identifier. |
| gameid | Yes | '' | A unique identifier of your page content. We use this data to match a video with your identifier. |
| title | Yes | '' | The name of your game. This values is used within the video player, but we also use this data to match a video with your title. Make sure its value is URL encoded. |
| pageurl | Yes | '' | The full URL of the current page, make sure its value is encoded. |
| colormain | No | '' | The main theme color of the HTML5 video player, use a CSS hex code (ff0080), without the #. |
| coloraccent | No | '' | The accent theme color of the HTML5 video player, use a CSS hex code (ff0080), without the #. |
| gdprtracking | Mandatory for European end-users | '' | Enable client tracking solutions. |
| gdprtargeting | Mandatory for European end-users | '' | Enable client advertisement targeting solutions. |
| langcode | No | 'en-us' | Currently only used for localising phrases within advertisements. |
| debug | No | '' | Enable debugging. Please keep it to false when publishing. |

### Embed as web component
Add the following script to your document.
```
window["TUBIA_OPTIONS"] = {
    "container": '[YOUR CONTAINER ELEMENT ID HERE]',
    "publisherId": '[YOUR PUBLISHER ID HERE]',
    "gameId": '[YOUR GAME ITS IDENTIFIER]',
    "title": '[YOUR GAME ITS TITLE]',
    "gdprTracking": true,
    "gdprTargeting": true,
};
(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = 'https://player.tubia.com/libs/gd/gd.js';
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'tubia-playerjs'));
```

You can also initialise the Tubia instance by simply (re)creating it. This is useful for when you want to load Tubia within a web application. Just make sure you pass the options as arguments in the constructor, instead of binding them to the window element. Otherwise the instance would auto initialise.
```
new Tubia.Player.default({
    "container": '[YOUR CONTAINER ELEMENT ID HERE]',
    "publisherId": '[YOUR PUBLISHER ID HERE]',
    "gameId": '[YOUR GAME ITS IDENTIFIER]',
    "title": '[YOUR GAME ITS TITLE]',
    "gdprTracking": [SET BY YOUR GDPR SOLUTION],
    "gdprTargeting": [SET BY YOUR GDPR SOLUTION],
});
```

#### Callbacks & Properties
##### Properties
You can use the following properties:

| Property | Mandatory | Default | Description |
| --- | --- | --- | --- |
| container | No | {String} 'player' | The container element id value. The HTML5 player will be embedded within. |
| publisherId | Yes | {String} '' | Your Tubia publisher identifier. |
| gameId | Yes | {String} '' | A unique identifier of your page content. We use this data to match a video with your identifier. |
| title | Yes | {String} '' | The name of your game. This values is used within the video player, but we also use this data to match a video with your title. Make sure its value is URL encoded. |
| colorMain | No | {String} '' | The main theme color of the HTML5 video player, you can use any CSS value, example; #ff0080. |
| colorAccent | No | {String} '' | The accent theme color of the HTML5 video player, you can use any CSS value, example; rgba(255, 255, 0, 0.5). |
| gdprTracking | Mandatory for European end-users | {Boolean} null | Enable client tracking solutions. |
| gdprTargeting | Mandatory for European end-users | {Boolean} null | Enable client advertisement targeting solutions. |
| langCode | No | 'en-us' | Currently only used for localising phrases within advertisements. |
| debug | No | {Boolean} false | Enable debugging. Please keep it to false when publishing. |

##### Callbacks
You can hook into the following callbacks:

| Callback | Returns | Description |
| --- | --- | --- |
| onStart | nothing | The very first moment everything is initializing. |
| onFound | {Object} - Video data | When a video - matching with your game - has been found. |
| onReady | {Object} - Player instance | When the HTML5 player is ready to play the video. This callback will only be returned when onStart and onFound have returned before. |
| onError | {Object} - Error data | When any error happens inside of Tubia. |

#### Styling/ CSS
The video player will be embedded straight into your web page as a component, so not within an iframe. This means you're free to completely style it to your wishes or even write plugins.

## Repository
The player is maintained on a public github repository.
<a href="https://github.com/gamedistribution/tubia-walkthrough-videos" target="_blank">https://github.com/gamedistribution/tubia-walkthrough-videos</a>

## Deployment
Deployment of this repository to production environments is done through TeamCity. The `./src/index.html` file should be deployed manually within the root of the bucket. This file allows the embedding of the player within an iframe.

## Installation for development
Install the following programs:
* [NodeJS LTS](https://nodejs.org/).
* [Grunt](http://gruntjs.com/).

Pull in the rest of the requirements using npm:
```
npm install
```

Setup a local node server, watch changes and update your browser view automatically:
```
grunt
```

Make a production build for the CDN solution. The npmjs version uses a "prepublish"-task defined within package.json, which does a simple babel task, similar to this task:
```
grunt build
```
