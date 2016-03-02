/**
* Squiz Matrix Multiple File Upload 2 (jquery.matrixupload2.js)
* Version: 0.1.2
* Copyright (C) 2016 Zed Said Studio
* @requires jQuery v1.7 or later
*
* Licensed under the MIT:
* http://www.opensource.org/licenses/mit-license.php
*
*/
;(function( $, window, document, undefined ){

	var MatrixUpload = function( elem, options ){
		this.elem = elem;
		this.$elem = $(elem);
		this.options = options;
		this.metadata = this.$elem.data( "plugin-options" );
	};

  // the plugin prototype
	MatrixUpload.prototype = {
		defaults: {
			hideMatrixLabels:		true,
			showAttributes:			false,
			uploadOnSelected:		true,
			layoutType:				'ZSSMatrixLayoutGrid',
			numColumns:				6,
			errorFileTooLarge:		'File size too large to upload',
			uploadButtonTitle:		'Upload Files',
			concurrentUploads:		4,
			queryParameters:		{},
			filesSelected:			function(files) {},
			progress:				function(progress) {},
			start:					function(e) {},
			complete:				function(e, responseText) {},
			failed:					function(e) {},
			canceled:				function(e) {},
			browserNotSupported:	function() {}
		},

	    init: function() {
	
			this.config = $.extend({}, this.defaults, this.options, this.metadata);
			this.assetBuilder = $.extend({}, this.assetBuilder);
			
			var elem = $(this.elem);
			
			// Hide labels
			if (this.config.hideMatrixLabels) {
				this._hideLabels();
			}
			
			// Check to see if there are errors initializing the plugin
			if (this._errors()) {
				return;	
			}
			
			// Set some default information about the HTML form element
			elem.addClass('zssMatrixUpload2');
			this.assetBuilder.url = this._url();
			this.assetBuilder.id = elem.attr('id').replace('page_asset_builder_', '');
			this.assetBuilder.createTypes = this._createTypes();
			this.assetBuilder.maxUploadSize = this._maxUploadSize();
			
			// Set the state defaults
			this.assetBuilder.filesToUpload = [];
			this.assetBuilder.incrementFiles = 0;
			this.assetBuilder.row = null;
			this.assetBuilder.indexOfRow = 1;
			this.assetBuilder.assetsToUpload = [];
			this.assetBuilder.assetsToUploadAll = [];
			this.assetBuilder.uploadStarted = false;
			
			// Modify default Asset Builder form elements
			this.assetBuilder.formInputs = elem.find('input');
			this.assetBuilder.formInputs.hide();
			this.assetBuilder.file = this._formElements();
			
			this._dropZone();
			this._bind();
			
			return this;
			
		},
		_errors: function() {
		
			// Check to see if we have formData support
			if(!this._support.supportAjaxUploadWithProgress()) {
				this._log('Error: Your browser does not support ajax progress upload. Please consider using a modern browser.');
				this.config.browserNotSupported();
				return true;
			}
			// Check if we are using a compatable layout type
			if (this.config.layoutType == '' || this.config.layoutType.length == 0) {
				this._log('Error: You need to specify a layout type.');
				return true;
			}
			// Check to see if they are trying to show attributes and upload on selected
			if (this.config.uploadOnSelected && this.config.showAttributes) {
				this._log('Error: You cannot show attributes and upload on selected.');
				return true;
			}
			// Check to see if we are using a valid layout type
			if ($.inArray(this.config.layoutType, this._validLayoutTypes()) == -1) {
				this._log('Error: "'+this.config.layoutType+'" is not a valid layout type. Valid types are '+this._validLayoutTypes().join(', ')+'.');
				return true;
			}
			// Check to see if a valid column number was used
			if ($.inArray(this.config.numColumns, this._validColumnTypes()) == -1) {
				this._log('Error: "'+this.config.numColumns+'" is not a valid column number. Valid numbers are '+this._validColumnTypes().join(', ')+'.');
				return true;
			}
			// Check if there are too many concurrent downloads
			if (this.config.concurrentUploads > 6) {
				this._log('Error: '+this.config.concurrentUploads+' concurrent downloads is too high. Most browser have a max of 6.');
				return true;
			}
			
			return false;
		},
		_validLayoutTypes: function() {
			return ['ZSSMatrixLayoutList', 'ZSSMatrixLayoutGrid'];
		},
		_validColumnTypes: function() {
			return [1, 2, 3, 4, 6, 12];
		},
		_support: {
			supportAjaxUploadWithProgress: function() {
				return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData();
				
				function supportFileAPI() {
					var fi = document.createElement('INPUT');
					fi.type = 'file';
					return 'files' in fi;
				};
				
				function supportAjaxUploadProgressEvents() {
					var xhr = new XMLHttpRequest();
					return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
				};
				
				function supportFormData() {
					return !! window.FormData;
				}
			}
		},
		_log:function(message) {
			if (window.console) {
				window.console.log(message);
			} else {
				alert(message);
			}
		},
		_url: function() {
		
			var url = $(this.elem).attr('action');
			var p = this.config.queryParameters;
			Object.size = function(obj) {
			    var size = 0, key;
			    for (key in obj) {
			        if (obj.hasOwnProperty(key)) size++;
			    }
			    return size;
			};
			if (Object.size(p) > 0) {
				var query = '';
				for (var key in p) {
				  if (p.hasOwnProperty(key)) {
				  	query += key+'='+p[key]+'&';
				  }
				}
				
				if (url.indexOf('?') != -1) {
					url = url+'&'+query;
				} else {
					url = url.replace('?', '')+'?'+query;
				}
				
			}
			
			return url;
		},
		_createTypes: function() {
			var _this = this;
			var createTypes = [];
			if ($('#sq-asset-builder-header').length) {
				$('#sq-asset-builder-header li').each(function() {
					var typeCode = $(this).attr('id').replace('page_asset_builder_'+_this.assetBuilder.id+'_type_', '').replace('_tab', '');
					createTypes.push(typeCode);
				});
			} else {
				var typeCode = $('[id*="CREATE_TYPE"]').val();
				createTypes.push(typeCode);
			}
			return createTypes;
		},
		_createTypeAllowed: function(asset) {
			return !($.inArray(asset.typeCode, this.assetBuilder.createTypes) == -1);
		},
		_duplicateFileName: function(asset) {
			var assets = this.assetBuilder.assetsToUploadAll;
			for (i = 0; i < assets.length; i++) { 
			    var a = assets[i];
			    if (a.file.name == asset.file.name) {
			    	return true;
			    }
			}
			return false;
		},
		_maxUploadSize: function() {
			return parseFloat($(this.elem).find('[id*="_file_upload"] span').text().replace(/[^0-9\.]+/g,""))*1000000;
		},
		_hideLabels: function() {
			$('[id*="choose_server"]').hide();
			$('.zssMatrixUpload2 div[id*="file_upload"] span').hide();
			$('#sq-asset-builder-header, .sq-asset-builder-tab-content').hide();
			$(this.elem).find('.sq-backend-smallprint').hide();
		},
		_formElements: function() {
			var file_element = $(this.elem).find(':file');
			if (file_element.length == 0) {
				alert('You are missing the file upload button. Make sure to include the %create_form% or %details-F_file_upload% keyword.');
				return;
			}
			file_element.attr('multiple', 'multiple');
		
			return file_element[0];
		},
		_dropZone: function() {
			$(this.elem).append('<div id="zssMatrixUpload" class="zsscontainer-fluid" />');
			$('#zssMatrixUpload').append('<div id="zssDropZone" class="row"><div class="col-sm-12"><div class="row"><div class="col-sm-12"><p class="hidden-xs">Click or Drop Here</p><p class="hidden-sm hidden-md hidden-lg">Tap Here</p></div></div></div></div>');
			if (!this.config.uploadOnSelected) {
				$('#zssMatrixUpload').append('<div style="display:none;" class="row zssUploadButton"><div class="col-sm-12"><button type="button">'+this.config.uploadButtonTitle+'</button></div></div>');
			}
		},
		_columns: function(num) {
			var col;
			switch (num) {
			    case 1:
			        col = 12;
			        break;
			    case 2:
			        col = 6;
			        break;
			    case 3:
			        col = 4;
			        break;
			    case 4:
			        col = 3;
			        break;
			    case 6:
			        col = 2;
			        break;
				}
				return col;
		},
		_fileType: function(type) {
			if (type.indexOf('image') != -1) {
				type = 'image';
			} else if (type.indexOf('pdf') != -1) {
				type = 'pdf_file';
			} else if (type.indexOf('css') != -1) {
				type = 'css_file';
			} else if (type.indexOf('javascript') != -1) {
				type = 'js_file';
			} else if (type.indexOf('spreadsheet') != -1 || type.indexOf('excel') != -1) {
				type = 'excel_doc';
			} else if (type.indexOf('wordprocessing') != -1 || type.indexOf('msword') != -1) {
				type = 'word_doc';
			} else if (type.indexOf('presentation') != -1 || type.indexOf('powerpoint') != -1) {
				type = 'powerpoint_doc';
			} else if (type.indexOf('audio') != -1) {
				type = 'mp3_file';
			} else if (type.indexOf('rtf') != -1) {
				type = 'rtf_file';
			} else if (type.indexOf('text/xml') != -1) {
				type = 'xml_file';
			} else if (type.indexOf('text') != -1) {
				type = 'text_file';
			} else if (type.indexOf('video') != -1) {
				type = 'video_file';
			} else {
				type = 'file';
			}
			return type;
		},
		_iconForFileType: function(type_code) {
			var icon;
			if (type_code == 'excel_doc') {
				icon = '<i class="fa fa-file-excel-o"></i>';
			} else if (type_code == 'word_doc') {
				icon = '<i class="fa fa-file-word-o"></i>';
			} else if (type_code == 'powerpoint_doc') {
				icon = '<i class="fa fa-file-powerpoint-o"></i>';
			} else if (type_code == 'image') {
				icon = '<i class="fa fa-file-image-o"></i>';
			} else if (type_code == 'js_file' || type_code == 'css_file') {
				icon = '<i class="fa fa-file-code-o"></i>';
			} else if (type_code == 'pdf_file') {
				icon = '<i class="fa fa-file-pdf-o"></i>';
			} else if (type_code == 'video_file') {
				icon = '<i class="fa fa-file-video-o"></i>';
			} else if (type_code == 'rtf_file' || type_code == 'text_file' || type_code == 'xml_file') {
				icon = '<i class="fa fa-file-text-o"></i>';
			} else {
				icon = '<i class="fa fa-file-o"></i>';
			}
			return icon;
		},
		_mediaTag: function(asset, imageWindow, forceIcon) {
			var media_tag = '';
			if (asset.typeCode == 'image' && !forceIcon) {
				var objectUrl = imageWindow.createObjectURL(asset.file);
				media_tag = '<div class="zssImage" style="background-image:url(\''+objectUrl+'\')"></div>';
			} else {
				media_tag = this._iconForFileType(asset.typeCode);
			}
			return media_tag;
		},
		_bytesToSize: function(bytes) {
			if (typeof bytes !== 'number') {
		        return '';
		    }
		    if (bytes >= 1000000000) {
		        return (bytes / 1000000000).toFixed(2) + ' GB';
		    }
		    if (bytes >= 1000000) {
		        return (bytes / 1000000).toFixed(2) + ' MB';
		    }
		    return (bytes / 1000).toFixed(2) + ' KB';
		},
		_buildLayout: function(asset) {
		
			// Check to see if the file size is too large
			var p = '<div class="zssProgress"></div>';
			if (!asset.createTypeAllowed) {
				p = '<div class="zssNoUploadWarning"><em>'+asset.typeCode+'</em> not configured as a create type</div>';
			} else if (asset.fileSizeTooLarge) {
				p = '<div class="zssNoUploadWarning">'+this.config.errorFileTooLarge+'</div>';
			} else if (asset.duplicateFileName) {
				p = '<div class="zssNoUploadWarning">A file with the name <em>'+asset.file.name+'</em> has already been uploaded and will conflict.</div>';
			}
			
			if (this.config.layoutType == 'ZSSMatrixLayoutList') {
				
				// Header row
				if ($('.zssList.header').length == 0) {
					var header = '<div class="row zssList header hidden-xs"><div class="col-sm-1"></div><div class="col-sm-5">File Name</div><div class="col-sm-2">Uploaded</div> <div class="col-sm-4">Progress</div></div>';
					$('#zssMatrixUpload').append(header);
				}
				
				var div = '<div id="'+asset.progress+'" class="row zssList"><div class="col-sm-1">'+asset.mediaTag+'</div><div class="zssName col-sm-5">'+asset.file.name+' ('+this._bytesToSize(asset.file.size)+')</div>'+'<div class="zssProgressInfo col-sm-2">0%</div> <div class="col-sm-4">'+p+'</div></div>';
				$('#zssMatrixUpload').append(div);
				
			} else if (this.config.layoutType == 'ZSSMatrixLayoutGrid') {
				if (!this.assetBuilder.row) {
					this.assetBuilder.row = $('<div class="row zssGrid"></div>');
					$('#zssMatrixUpload').append(this.assetBuilder.row);
				}
				var showAttributes = '';
				if (this.config.showAttributes && !asset.fileSizeTooLarge && !this.config.uploadOnSelected) {
				
					// Find all input fields for this asset type, but not select menu's
					var typeInputs = this.assetBuilder.formInputs.filter('[name*="'+asset.typeCode+'"]').not(':file, select, :button');
					typeInputs.each(function() {
						
						var inputName = $(this).attr('name');
						var htmlType = $(this).prop('tagName').toLowerCase();
						var a = '';
						if (htmlType == 'textarea') {
							a = '<textarea name="'+inputName+'"></textarea>';
						} else if (htmlType == 'input') {
							a = '<input type="'+$(this).attr('type')+'" name="'+inputName+'" />';
						}
						showAttributes += '<div class="row"><div class="col-sm-12">'+a+'</div></div>';
						$(this).remove();
						
					});
					
				}
				var div = '<div id="'+asset.progress+'" class="col-md-'+asset.columnNumber+' col-sm-6 col-xs-12"><div class="row"><div class="col-sm-12">'+asset.mediaTag+'</div></div><div class="row"><div class="col-sm-12"><div class="zssImageInfo">'+asset.file.name+' ('+this._bytesToSize(asset.file.size)+')</div></div></div><div class="row"><div class="col-sm-12">'+p+'</div></div>'+showAttributes+'</div>';
				this.assetBuilder.row.append(div);
			}
			window.URL.revokeObjectURL(asset.file);
			
			if (this.assetBuilder.indexOfRow == this.config.numColumns) {
				this.assetBuilder.row = null;
				this.assetBuilder.indexOfRow = 1;
			} else {
				this.assetBuilder.indexOfRow++;
			}
		},
		_formData: function(asset) {
			var fd = new FormData();
			var type_code_file_input = $('input[name*="'+asset.typeCode+'_0"]:file');
			fd.append(type_code_file_input.attr('name'), asset.file);
			this.assetBuilder.formInputs.each(function() {
				var input_name = $(this).attr('name');
				var input_val;
				if (input_name.indexOf('CREATE_TYPE') != -1) {
					input_val = asset.typeCode;	
				} else {
					input_val = $(this).val();
				}
				fd.append(input_name, input_val);
			});
			return fd;
		},
		_progress: function(asset, e) {
			var percentComplete = Math.min(100, Math.round(e.loaded * 100 / e.total));
			var percent = percentComplete.toString();
			if (!$('#'+asset.progress+' .zssProgress').hasClass('active')) {
				$('#'+asset.progress+' .zssProgress').addClass('active');
			}
			$('#'+asset.progress+' .zssProgress').css('width', percent + '%');
			$('#'+asset.progress+' .zssProgressInfo').text(' '+percent+'%');
			this.config.progress(percent);
		},
		_makeRequest: function(asset) {
			var _this = this;
			var xhr = new XMLHttpRequest();
			xhr.upload.addEventListener('progress', function(e) {
				if (e.lengthComputable) {
					_this._progress(asset, e);
				}
			});
			xhr.addEventListener('load', function(e) {
				_this._complete(e, _this, asset, xhr.responseText);
			});
			xhr.upload.addEventListener('error', function(e) {
				_this._failed(e, _this);
			});
			xhr.upload.addEventListener("abort", function(e) {
				_this._canceled(e, _this);
			});
			xhr.upload.addEventListener("loadstart", function(e) {
				_this._start(e, _this);
			});
			xhr.open("POST", this.assetBuilder.url, true);
			xhr.send(this._formData(asset));
			
			// Remove the asset once the request has been made
			var i = _this.assetBuilder.assetsToUpload.indexOf(asset);
			if (i != -1) {
				_this.assetBuilder.assetsToUpload.splice(i, 1);
			}
			
		},
		_prepareUpload: function() {
			
			var files = this.assetBuilder.filesToUpload;
			if (files) {
				var imageWindow = window.URL || window.webkitURL;
				var colNumber = this._columns(this.config.numColumns);
				for (var i = 0, file; file = files[i]; i++) {
					
					// Asset information
					var asset = {};
					asset.file = file;
					asset.typeCode = this._fileType(file.type);
					asset.progress = 'zssProgress'+i+'_'+this.assetBuilder.incrementFiles;
					asset.mediaTag = this._mediaTag(asset, imageWindow, this.config.layoutType == 'ZSSMatrixLayoutGrid' ? false : true);
					asset.columnNumber = colNumber;
					asset.fileSizeTooLarge = !(asset.file.size <= this.assetBuilder.maxUploadSize);
					asset.createTypeAllowed = this._createTypeAllowed(asset);
					asset.duplicateFileName = this._duplicateFileName(asset);
					
					if (!asset.fileSizeTooLarge && asset.createTypeAllowed && !asset.duplicateFileName) {
						this.assetBuilder.assetsToUpload.push(asset);
						this.assetBuilder.assetsToUploadAll.push(asset);
					}
					
					this.assetBuilder.incrementFiles++;
					
					// Build the layout
					this._buildLayout(asset);
					
				}//end for
				
				if (this.config.uploadOnSelected) {
					this._upload();
				}
				
			}//end if
		},
		_upload: function() {
			
			if (this.assetBuilder.assetsToUpload.length > 0) {
				
				// Loop through the assets to upload, but only upload in our chunk size, we only do this the first time
				var size = (this.config.concurrentUploads <= this.assetBuilder.assetsToUpload.length) ? this.config.concurrentUploads : this.assetBuilder.assetsToUpload.length;
				if (!this.assetBuilder.uploadStarted) {
					for (i = 0; i < size; i++) { 
					    var asset = this.assetBuilder.assetsToUpload[i];
					    if (asset) {
					    	this._makeRequest(asset);
					    }
					}//end for
					this.assetBuilder.uploadStarted = true;
				} else {
					var asset = this.assetBuilder.assetsToUpload[0];
					if (asset) {
						this._makeRequest(asset);
					}
				}//end else
			} else {
				this.assetBuilder.uploadStarted = false;
				this.assetBuilder.assetsToUpload = [];
			}//end else
			
		},
		_complete: function(e, _this, asset, responseText) {
			_this._upload();
			_this.config.complete(e, responseText);
		},
		_start: function(e, _this) {
			_this.config.start(e);
		},
		_failed: function(e, _this) {
			_this.config.failed(e);
		},
		_canceled: function(e, _this) {
			_this.config.canceled(e);
		},
		_filesSelected: function(e, _this) {
			var files = _this.assetBuilder.filesToUpload;
			_this.config.filesSelected(files);
			if (!_this.config.uploadOnSelected) {
				$('#zssMatrixUpload .zssUploadButton').show();
			}
		},
		_bind: function() {
		
			var elem = $(this.elem);
			var _this = this;
			var drop = '#zssDropZone';
			
			$(document).on('change', elem, function(e) {
				_this.assetBuilder.filesToUpload = _this.assetBuilder.file.files;
				_this._filesSelected(e, _this);
				_this._prepareUpload();
			});
			$(document).on('click', drop, function() {
				_this.assetBuilder.file.click();
			});
			$(document).on('dragover', drop, function(e) { 
			    $(drop).addClass('hover');
			    e.preventDefault();
			    e.stopPropagation();
			});
			$(document).on('dragleave', drop, function(e) {
			    $(drop).removeClass('hover');
			    e.preventDefault();
			    e.stopPropagation();
			});
			$(document).on('drop', drop, function(e) {
				e = e.originalEvent || e;
				_this.assetBuilder.filesToUpload = e.files || e.dataTransfer.files;
				_this._filesSelected(e, _this);
				_this._prepareUpload();
				e.preventDefault();
				e.stopPropagation();
			});
			$(document).on('click', '.zssUploadButton button', function(e) {
				_this._upload();
			});
		}
	
	}

	MatrixUpload.defaults = MatrixUpload.prototype.defaults;
	
	$.fn.matrixUpload = function(options) {
		return this.each(function() {
			new MatrixUpload(this, options).init();
		});
	};

})( jQuery, window , document );

