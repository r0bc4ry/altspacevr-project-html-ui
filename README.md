# AltspaceVR Programming Project - Spaces Admin Web Frontend

## The Basics

I used AngularJS as my framework for this project alongside Sass (SCSS) for the styles. Normalize.css was used for the CSS reset file and Bourbon mixin library for Sass was used with Bourbon Neat to build in future support for responsiveness. I utilized NPM and Bower for package management with Gulp to do my file compilation during development. 

All source files are located under the `src` folder, while built/public files are located within the `dist` folder. I've included the minified version of the app within the `dist` folder for your convenience. All vendor JS/CSS is combined into `vendor.js` and `vendor.css` files. App code is compiled into `app.css`, `app.js`, and `templates.js` files. The `templates.js` contains cached versions ($templateCache) of the HTML templates located in the `src` directory to prevent unnecessary requests. 

I really enjoyed working on this project and I hope you like what I've created!

## Enhancements

- Included a Gulp build process with file watching, LiveReload, and production minification
- Wrapped the included data store in a custom shim to provide caching and basic error checking/handling
- Included space analytics with a dynamic chart of active users in the past 24 hours
- Added space search and filtering to the dashboard
- Added member search when selecting a space's members
- Added basic input validating during space creating and editing with an error message

## Dashboard

The dashboard provides a simple table layout of the current spaces. Spaces can be searched or filtered at the top of the page based on their type. A common header throughout the app allows users to create a new space at any time. Selecting a space will take you a page with more detailed information about it.

## Space Details

After selecting a space from the dashboard, users are taken to a detailed page about the space that includes analytics, the space's members, a way to edit space information, and the ability to delete the space. 

The analytics section reads some basic information I added to the data store along with creating a dynamic chart of active users. Since this would be a lot to store in the data store for each space, I have some placeholder code randomly generating numbers for each of the last 24 hours to populate the chart - this could easily be replaced by data from a backend in the future. Hovering over a data point in the graph also gives a tooltip with the specific count of the users at that time.

The members section lists all current members in a grid with the ability to select/deselect a user as a member of the space. I separated this from the edit page to make the UI a littler cleaner than adding a list of members alongside the edit form. The edit form allows for changing the space's basic information along with a way to save/cancel the changes. Finally, the "Danger Zone" is a section that allows users to delete a space along with a confirmation dialog.

## Possible Future Enhancements

- Compile minified JS into a single file (currently separated into `app.js`, `templates.js`, and `vendor.js`)
- Compile minified CSS into a single file (currently separated into `app.css`, `vendor.css`)
- Add pagination support for data returned from the backend
- Move create/delete dialog controllers into their own files
- Add AJAX loading icons while retrieving information from the backend
- Add better support for small(er) screens using Bourbon Neat

## Development

1. Run `npm install` to get the development dependencies
2. Run `bower install` to get the frontend dependencies
3. Run `gulp` to build the project files (unminified)
    * `gulp watch` will enable file watching and LiveReload
    * `gulp build` will build and minify the project files
