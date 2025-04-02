[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE.md)

This repo provides components for metadata [https://iqb-vocabs.github.io](https://iqb-vocabs.github.io/).

# ngx-metadata-components

[![npm](https://img.shields.io/npm/v/%40iqb%2Fngx-metadata-components)](https://www.npmjs.com/package/@iqb/ngx-coding-components)

Library with angular components for metadata.

## Testing

During development, use the application in the folder `/src`. The script `start` in `package.json` might help to start. 
If you did changes in the component library, first start the script `build_mc` in `package.json` to build into the `dist` folder first.

## Publishing

The steps to publish a new release of the library:
* Update the version in `projects/ngx-metadata-components/package.json`
* Update README.md in `projects/ngx-metadata-components` to let people know about the changes
* Build: Use the script `build_mc` in `package.json`
* Publish: Use the script `npm_publish` in `package.json`
