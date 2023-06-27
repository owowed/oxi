# oxi

JavaScript library that provide common tools, utilities, helpers to help and ease the development of userscript.

## How to Use

The main build of the library is available in the `dist` folder.

To use this library, simply add the following lines to your userscript header:

```javascript
// ==UserScript==
// ...
// @require   https://github.com/owowed/oxi/raw/main/dist/oxi.umd.js
// ...
// ==/UserScript==
```

All methods are contained within `oxi` namespace, you should be able to use one of `oxi`'s method like this:

```javascript
const element = await oxi.waitForElement("div.hello-world");
const observer = oxi.makeMutationObserver({ target: element },
    ({ records }) => console.log("Mutation detected: ", records));
```

## Docs

At the moment, documentation about how these methods work are available inside the source code in `src` as JSDoc comments.

## Contributing

If you have any ideas for new userscripts or improvements to existing ones, feel free to fork this repository and submit a pull request.

## License

This repository and all of its libraries are licensed under [GNU LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html), a free and open-source license. For more information, please see the [license file](https://github.com/owowed/userscript-common/blob/main/LICENSE.txt).