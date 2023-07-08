<h1 align="center">oxi</h1>

<div align="center">A comprehensive JavaScript package providing essential tools, utilities, and helpers to streamline the development of userscripts.</div>

## Getting Started

To start using the oxi package, you need to include it in your userscript header.

The release build of the package is available in the [`dist`](https://github.com/owowed/oxi/tree/dist) branch, which is updated automatically each time a new release is published.

To include this package, simply add the following lines to your userscript header:

```javascript
// ==UserScript==
// ...
// @require   https://github.com/owowed/oxi/raw/dist/oxi.umd.js
// ...
// ==/UserScript==
```

## Usage

All methods are organized within `oxi` namespace. Here is an example on how to use one of the `oxi` methods:

```javascript
const element = await oxi.waitForElement("div.hello-world");
const observer = oxi.makeMutationObserver(
    { target: element },
    ({ records }) => console.log("Mutation detected: ", records));
```

## Docs

At the moment, documentation about these methods are available inside the source code in `src` as JSDoc comments.

For upcoming release tag of this package, see the [`package`](https://github.com/owowed/oxi/tree/package) branch.

## Contributing

If you have found a bug or a mistake on our project, please report it by submitting an [issue](https://github.com/owowed/oxi/issues)!

If you have any ideas or suggestions for improvements, feel free to submit an [issue](https://github.com/owowed/oxi/issues)!


If you want to contribute directly to our project, feel free fork this repository and submit a pull request! But before doing that, please read our [Contributor Guidelines & Documentation](./docs/CONTRIBUTING.md).

For commit message, we follow very similiar style to [Angular's Commit Message Format](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format).

## License

This project is licensed under [GNU LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html), a free and open-source license. For more information, please see the [license file](./LICENSE).
