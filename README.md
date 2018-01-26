# Tools99
Tools99 is a bookmarklet toolkit of chrome extensions that includes useful scripts and websites. 

You can easily add/edit scripts that'll be injected into the page, or open your favorite sites. All of the scripts and urls can be imported from local file for custom or remote url for central control. 

All of the information is saved in local database.

## Configuration
Some sample scripts are provided as 'sample.json', by click the right top cornner 'setting', and choose "import from url".

Before import, please remember to remove all comment lines.

  [
  	// script sample
    {
      // Item with the same group name will be grouped.
      "group": "Private Tool",
      "name": "Auto Login",
      "type": "script",  // script or url
      "content": "alert('javascript code here...')",
      "provider": "Author name"
    },
    // url sample
    {
      "group": "Favorite Sites",
      "name": "Google",
      "type": "url",
      "content": "https://www.google.com/",
      "provider": "Google Inc."
    }
  ]

You can download the extension at chrome web store: https://chrome.google.com/webstore/detail/tools99/nmlhocfcgemimeloecfljgcamhhmdidb

## Homepage
![homepage screenshot](https://raw.githubusercontent.com/damonpeng/tools99/master/screenshots/home.png)

## Add script
![add script page screenshot](https://raw.githubusercontent.com/damonpeng/tools99/master/screenshots/add.png)

## Import script
![import page screenshot](https://raw.githubusercontent.com/damonpeng/tools99/master/screenshots/setting.png)
