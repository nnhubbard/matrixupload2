/**
* Squiz Matrix Multiple File Upload 2 (jquery.matrixupload2.js)
* version: 0.1 (NOV-19-2014)
* Copyright (C) 2014 Zed Said Studio
* @requires jQuery v1.3 or later
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
			hideMatrixLabels:	true,
			showAttributes:		true,
			uploadOnSelected:	true,
			layoutType:			'ZSSMatrixLayoutGrid',// options are ZSSMatrixLayoutList, ZSSMatrixLayoutGrid
			numColumns:			6,// Must be multiple of 12
			filesSelected:		function(files) {},
			progress:			function(progress) {},
			complete:			function(e, responseText) {},
			failed:				function(e) {},
			cancelled:			function(e) {}
		},

	    init: function() {
	
			this.config = $.extend({}, this.defaults, this.options, this.metadata);
			this.assetBuilder = $.extend({}, this.assetBuilder);
			
			var elem = $(this.elem);
			
			// Check if we are using a compatable layout type
			if (MatrixUpload.defaults.layoutType == '' || MatrixUpload.defaults.layoutType.length == 0) {
				alert('You need to specify a layout type.');
				return;
			}
			// Check to see if we have formData support
			if(typeof FormData == 'undefined') {
				alert('Your browser does not support this method of uploading. Please consider using a modern browser.');
				return;
			}
			
			// Hide labels
			if (MatrixUpload.defaults.hideMatrixLabels) {
				this._hideLabels();
			}
			
			// Set some default information about the HTML form element
			elem.addClass('zssMatrixUpload2');
			this.assetBuilder.url = elem.attr('action');
			this.assetBuilder.id = elem.attr('id').replace('page_asset_builder_', '');
			this.assetBuilder.createTypes = this._createTypes();
			this.assetBuilder.maxUploadSize = this._maxUploadSize();
			
			// Set the state defaults
			this.assetBuilder.droppedFiles = null;
			this.assetBuilder.incrementFiles = 0;
			this.assetBuilder.row = null;
			this.assetBuilder.indexOfRow = 1;
			
			// Modify default Asset Builder form elements
			this.assetBuilder.formInputs = elem.find('input');
			this.assetBuilder.formInputs.hide();
			this.assetBuilder.file = this._formElements();
			
			// Build the drag and drop location
			this._dropZone();
			
			// Bind all of the events needed for this plugin to be awesome
			this._bind();
			
			return this;
		},
		_createTypes: function() {
		
			var elem = $(this.elem);
			var _this = this;
			
			// Check to see if we have more than one create type
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
		
			var elem = $(this.elem);
			
			// Allow multiple selection
			var file_element = elem.find(':file');
			if (file_element.length == 0) {
				alert('You are missing the file upload button. Make sure to include the %create_form% or %details-F_file_upload% keyword.');
				return;
			}
			file_element.attr('multiple', 'multiple');
		
			return file_element[0];
		},
		_dropZone: function() {
			$(this.elem).append('<div id="zssMatrixUpload" class="zsscontainer-fluid" />');
			$('#zssMatrixUpload').append('<div id="zssDropZone" class="row"><div class="col-sm-12"><div class="row"><div class="col-sm-12"><p>Drop Here</p></div></div></div></div>');
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
			}else if (type.indexOf('pdf') != -1) {
				type = 'pdf_file';
			} else if (type.indexOf('css') != -1) {
				type = 'css_file';
			}else if (type.indexOf('javascript') != -1) {
				type = 'js_file';
			}else if (type.indexOf('spreadsheet') != -1 || type.indexOf('excel') != -1) {
				type = 'excel_doc';
			} else if (type.indexOf('wordprocessing') != -1 || type.indexOf('msword') != -1) {
				type = 'word_doc';
			} else if (type.indexOf('audio') != -1) {
				type = 'mp3_file';
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
			} else if (type_code == 'js_file' || type_code == 'css_file') {
				icon = '<i class="fa fa-file-code-o"></i>';
			} else if (type_code == 'pdf_file') {
				icon = '<i class="fa fa-file-pdf-o"></i>';
			}
			return icon;
		},
		_mediaTag: function(asset, imageWindow) {
			var media_tag = '';
			if (asset.typeCode == 'image') {
				var objectUrl = imageWindow.createObjectURL(asset.file);
				media_tag = '<img class="zssImage" src="'+objectUrl+'" />';
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
		_bind: function() {
		
			var elem = $(this.elem);
			var _this = this;
			var drop = '#zssDropZone';
			
			$(document).on('change', elem, function(e) {
				_this.fileSelected();
				if (MatrixUpload.defaults.uploadOnSelected) {
					_this._upload();
				}
			});
			$(document).on('click', drop, function() {
				_this.assetBuilder.file.click();
			});
			$(document).on('dragover', drop, function(e) {
			    elem.addClass('hover');
			    e.preventDefault();
			    e.stopPropagation();
			});
			$(document).on('dragend', drop, function(e) {
			    elem.removeClass('hover');
			    e.preventDefault();
			    e.stopPropagation();
			});
			$(document).on('drop', drop, function(e) {
				e = e.originalEvent || e;
				_this.assetBuilder.droppedFiles = e.files || e.dataTransfer.files;
				//control.uploadFiles();
				if (_this.defaults.uploadOnSelected) {
					_this._upload();
				}
				e.preventDefault();
				e.stopPropagation();
			});
		},
		_buildLayout: function(asset) {
			if (MatrixUpload.defaults.layoutType == 'ZSSMatrixLayoutList') {
				var div = '<div id="'+asset.progress+'" class="row"><div class="col-sm-2">'+asset.mediaTag+'</div><div class="zssName col-sm-3">'+asset.file.name+' ('+this._bytesToSize(file.size)+')</div>'+'<div class="zssProgressInfo col-sm-3"></div> <div class="col-sm-4"><div class="zssProgress"></div></div></div>';
				$('#zssMatrixUpload').append(div);
			} else if (MatrixUpload.defaults.layoutType == 'ZSSMatrixLayoutGrid') {
				if (!this.assetBuilder.row) {
					this.assetBuilder.row = $('<div class="row zssGrid"></div>');
					$('#zssMatrixUpload').append(this.assetBuilder.row);
				}
				var showAttributes = '';
				if (MatrixUpload.defaults.showAttributes) {
				
					// Find all input fields for this asset type, but not select menu's
					var typeInputs = this.assetBuilder.formInputs.filter('[name*="'+asset.typeCode+'"]').not(':file, select, :button');
					typeInputs.each(function() {
						
						var inputName = $(this).attr('name');
						var htmlType = $(this).prop('tagName').toLowerCase();
						if (htmlType == 'textarea') {
							var textarea = '<textarea name="'+inputName+'"></textarea>';
						} else if (htmlType == 'input') {
							var input = '<input type="'+$(this).attr('type')+'" name="'+inputName+'" />';
						}
						
					});
					
					//showAttributes = '<div class="row"><div class="col-sm-12">'+a+'</div></div>';
				}
				var div = '<div id="'+asset.progress+'" class="col-md-'+asset.columnNumber+' col-sm-6 col-xs-12"><div class="row"><div class="col-sm-12">'+asset.mediaTag+'<div class="zssImageInfo">'+asset.file.name+' ('+this._bytesToSize(asset.file.size)+')</div></div></div><div class="row"><div class="col-sm-12"><div class="zssProgress"></div></div></div>'+showAttributes+'</div>';
				this.assetBuilder.row.append(div);
			}
			window.URL.revokeObjectURL(asset.file);
			
			if (this.assetBuilder.indexOfRow == MatrixUpload.defaults.numColumns) {
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
			$('#'+asset.progress+' .zssProgress').css('width', percent + '%');
			$('#'+asset.progress+' .zssProgressInfo').text(' '+percent+'%');
			MatrixUpload.defaults.progress(percent);
		},
		_makeRequest: function(asset) {
			var _this = this;
			if (asset.file.size <= this.assetBuilder.maxUploadSize) {
				var xhr = new XMLHttpRequest();
				(function(progress) { 
				    xhr.upload.onprogress = function(e) {
				        if (e.lengthComputable) {
				        	_this._progress(asset, e);
				        }
				    };
				}(asset.progress));
				xhr.addEventListener("load", this.complete, false);
				xhr.addEventListener("error", this.failed, false);
				xhr.addEventListener("abort", this.canceled, false);
				xhr.open("POST", this.assetBuilder.url);
				xhr.send(this._formData(asset));
			} else {
				// The file size is too large, do not upload
				$('#'+asset.progress).addClass('zssNoUpload');
				if (MatrixUpload.defaults.layoutType == 'ZSSMatrixLayoutGrid') {
					$('#'+asset.progress+' .zssImageInfo').after('<div class="zssNoUploadWarning">File size too large to upload</div>');
				}
			}
		},
		_upload: function() {
			var files = this.assetBuilder.droppedFiles ? this.assetBuilder.droppedFiles : this.assetBuilder.file.files;
			this.assetBuilder.droppedFiles = null;
			if (files) {
				var imageWindow = window.URL || window.webkitURL;
				var colNumber = this._columns(MatrixUpload.defaults.numColumns);
				for (var i = 0, file; file = files[i]; i++) {
					
					// Asset information
					var asset = {};
					asset.file = file;
					asset.typeCode = this._fileType(file.type);
					asset.progress = 'zssProgress'+i+'_'+this.assetBuilder.incrementFiles;
					asset.mediaTag = this._mediaTag(asset, imageWindow);
					asset.columnNumber = colNumber;
					
					this.assetBuilder.incrementFiles++;
					
					// Build the layout
					this._buildLayout(asset);
					
					// Make the request to upload
					this._makeRequest(asset);
					
				}//end for
			}//end if
		},
		complete: function(e, responseText) {
			MatrixUpload.defaults.complete(e, e.target.responseText);
		},
		failed: function(e) {
			MatrixUpload.defaults.failed(e);
		},
		cancelled: function(e) {
			MatrixUpload.defaults.cancelled(e);
		},
		fileSelected: function() {
			var files = this.assetBuilder.file.files;
			MatrixUpload.defaults.filesSelected(files);
		},
	
	
	}

	MatrixUpload.defaults = MatrixUpload.prototype.defaults;
	
	$.fn.matrixUpload = function(options) {
		return this.each(function() {
			new MatrixUpload(this, options).init();
		});
	};

})( jQuery, window , document );

