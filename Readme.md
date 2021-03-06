
# issue-explorer

> Explore Github issues from your terminal. See [introductory post](https://gochomugo.github.io/musings/issue-explorer).

[![node](https://img.shields.io/node/v/issue-explorer.svg?style=flat-square)](https://www.npmjs.com/package/issue-explorer) [![npm](https://img.shields.io/npm/v/issue-explorer.svg?style=flat-square)](https://www.npmjs.com/package/issue-explorer) [![Travis](https://img.shields.io/travis/GochoMugo/issue-explorer.svg?style=flat-square)](https://travis-ci.org/GochoMugo/issue-explorer) [![Gemnasium](https://img.shields.io/gemnasium/GochoMugo/issue-explorer.svg?style=flat-square)](https://gemnasium.com/GochoMugo/issue-explorer) [![Coveralls](https://img.shields.io/coveralls/GochoMugo/issue-explorer.svg?style=flat-square)](https://coveralls.io/github/GochoMugo/issue-explorer?branch=master)

[![asciicast](https://asciinema.org/a/25174.png)](https://asciinema.org/a/25174)


## installation:

```bash
$ npm install issue-explorer --global
```


## exploring:

```bash
$ issue-explorer all RepoName/UserName       # all issues

$ issue-explorer open RepoName/UserName      # open issues

$ issue-explorer closed RepoName/UserName    # closed issues

$ issue-explorer [open|all|closed] RepoName/UserName#7 # single issue

$ issue-explorer [open|all|closed]    # detects repo from cwd and explores issues
```

These commands will open a nice, simple interface for browsing.

* To **navigate up and down**, use the normal arrow keys
* press `Space` to **load more** issues
* press `Enter` on an issue on the list to **open the single issue**
* press `o` on the single issue to **open in browser**
* **navigate back** to the list of issues using the key `q`.
* **exit** using `Cmd/Ctrl + C` or `esc`.
* **`gie`** is an alias for `issue-explorer`

> **Note:** opening a single issue will succeed whether it is open or closed


## authorization:

You can use the application without authenticating with Github. However, you face the risk of going over the limit of requests allowed per hour. Authenticated requests have a [way higher rate limit](https://developer.github.com/v3/#rate-limiting).

To authorize issue-explorer:

```bash
$ issue-explorer auth
```

This will prompt you for your username and password. These are used to create an access token that will be stored on your computer and used in consequent requests rather than your password. You can view/update/revoke the created access token in [your settings panel](https://github.com/settings/tokens).


## misc:

**Errors** are appended to a **gie.log** file in the current working directory. If the interface suddenly shuts down due to an error, you can inspect the file. Please **copy over the log** when [reporting the issue](https://github.com/GochoMugo/issue-explorer/issues).


> HAPPY EXPLORING! :sunglasses:


## license:

__The MIT License (MIT)__

Copyright (c) 2015 GochoMugo <mugo@forfuture.co.ke>
