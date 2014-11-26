Squiz Matrix Multiple File Upload jQuery Plugin
=============

This plugin is for the `Squiz Matrix` CMS and when used in conjunction with an `Asset Builder` you can have simple and beautiful multiple file upload using jQuery and javascript.

`MatrixUpload2` has the following features:

* Multiple file upload using drag and drop or choosing the files.
* Upload on mobile/tablet or desktop.
* Simple integration with an `Asset Builder`.
* Create Type enforcement. Won't let you upload files the `Asset Builder` doesn't allow.
* Max file size upload enforcement based on your `Squiz Matrix` settings.
* Two layouts to choose from
* File upload progress
* File information such as name, file size, etc.
* Thumbnail image previews
* Fully responsive layout

Coming soon:

* Set attributes before uploading

How It Works
---

1. Create an `Asset Builder`.
2. Configure `Asset Types to Create`. Choose only the types that you want to be allowed to upload.
3. Set the `Create Location`.
4. Add `%create_form%` to the `Logged In` or `Not Logged In` bodycopy.
5. Include `jquery.matrixupload2.js` and `matrixupload2.css` in your page or `Design` file. Optionally include [Font Awesome](http://fortawesome.github.io/Font-Awesome/) if you want icons to be used for various asset types (recommended).
6. Include the plugin:

In the `Logged In` or `Not Logged In` bodycopy add the following script:

```javascript
$('form[id*="asset_builder"]').matrixUpload();
```

Additional options can be included if you want to change the layout or use some of the callbacks:

```javascript
$('form[id*="asset_builder"]').matrixUpload({
    progress: function(progress) {
        console.log(progress);	
    },
    filesSelected: function(files) {
        console.log(files.length);	
    }
});
```

Optionional query parameters can be sent which will be appended to the URL when each asset is created. This can be used with `Additional Create Locations` and `GET Variable Name`.

```javascript
$('form[id*="asset_builder"]').matrixUpload({
    queryParameters: {
        'root': '1234'
    }
});
```

**Make sure to call the plugin inside of the `jQuery` [ready method](http://api.jquery.com/ready) so that the DOM will be fully loaded.**

Options
---

The full list of options that can be used:

| Option     | Default   | Type  | Description  |
| :------------- | :-------------| :----- | :----- |
| hideMatrixLabels | true  | boolean | Hides all labels that the Asset Builder includes. |
| showAttributes   | false | boolean | Shows attribute fields for each file. **NOT READY FOR USE** |
| uploadOnSelected | true  | boolean | If the files should upload after they are chosen. Else use an upload button. **NOT READY FOR USE** |
| layoutType       | ZSSMatrixLayoutGrid | string | Which layout to use. Options are `ZSSMatrixLayoutGrid` and `ZSSMatrixLayoutList`. |
| numColumns       | 6     | number  | How many columns to use for the desktop layout. Mobile and tablet are automatic. Options are `1`, `2`, `3`, `4`, `6`, `12`. |
| errorFileTooLarge | File size too large to upload | string | Label to use when a file is too large to upload |
| uploadButtonTitle | Upload Files | string | Label to use for the upload button |
| queryParameters   | {} | object | Key/value pairs to send as part of the query string |

Callbacks

| Callback     | Returned objects  | Description  |
| :------------- | :-------------| :----- | :----- |
| filesSelected | files |  Called when files are selected or dropped |
| progress | progress |  Progress of the upload |
| start | e |  When the upload starts for a file |
| complete | e |  When the upload completes for a file |
| failed | e |  When the upload fails for a file |
| cancelled | e |  When the upload is cancelled for a file |
| browserNotSupported |  |  If the browser does not support file upload using ajax |


Requirements
--------------
`MatrixUpload2` requires `jQuery 1.7` or later and a modern browser.
