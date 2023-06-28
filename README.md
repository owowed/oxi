# oxi

JavaScript package that provide common tools, utilities, helpers to help and ease the development of userscript.

## How to Use

The release build of the package is available in the [`dist`](https://github.com/owowed/oxi/tree/dist) branch. This branch will automatically update each time a release is published.

To use this package, simply add the following lines to your userscript header:

```javascript
// ==UserScript==
// ...
// @require   https://github.com/owowed/oxi/raw/dist/oxi.umd.js
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

At the moment, documentation about these methods are available inside the source code in `src` as JSDoc comments.

## Contributing

If you have any ideas for new userscripts or improvements to existing ones, feel free to fork this repository and submit a pull request.

Please follow [Angular's Commit Message Format guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format) when contributing.

## License

This project is licensed under [GNU LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html), a free and open-source license. For more information, please see the [license file](./LICENSE).