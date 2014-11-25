Squiz Matrix Multiple File Upload jQuery Plugin
=============

This plugin is for the `Squiz Matrix` CMS and when used in conjunction with an `Asset Builder` you can have simple and beautiful multiple file upload using jQuery and javascript.

How It Works
---

In your `Logged In` or `Not Logged In` bodycopy add the following script:

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

Options
---

The full list of options that can be used:

| Option     | Default   | Type  | Description  |
| :------------- | :-------------| :----- | :----- |
| hideMatrixLabels | true  | boolean | Hides all labels that the Asset Builder includes. |
| showAttributes   | false | boolean | Shows attribute fields for each file. |
| uploadOnSelected | true  | boolean | If the files should upload after they are chosen. Else use an upload button. |
| layoutType       | ZSSMatrixLayoutGrid | string | Which layout to use. Options are `ZSSMatrixLayoutGrid` and `ZSSMatrixLayoutList`. |
| numColumns       | 6     | number  | How many columns to use for the desktop layout. Mobile and tablet done automatically. |


Requirements
--------------
`MatrixUpload2` requires `jQuery 1.7` or later.
