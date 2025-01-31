/**
 * @description This module takes care of the sidebar.
 */

let sidebar = {
	_dom: $(".sidebar"),
	types: {
		DEFAULT: 0,
		TAGS: 1,
		PALETTE: 2,
	},
	createStructure: {},
};

sidebar.dom = function (selector) {
	if (selector == null || selector === "") return sidebar._dom;

	return sidebar._dom.find(selector);
};

sidebar.bind = function () {
	// This function should be called after building and appending
	// the sidebars content to the DOM.
	// This function can be called multiple times, therefore
	// event handlers should be removed before binding a new one.

	// Event Name
	let eventName = lychee.getEventName();

	sidebar
		.dom("#edit_title")
		.off(eventName)
		.on(eventName, function () {
			if (visible.photo()) photo.setTitle([photo.getID()]);
			else if (visible.album()) album.setTitle([album.getID()]);
		});

	sidebar
		.dom("#edit_description")
		.off(eventName)
		.on(eventName, function () {
			if (visible.photo()) photo.setDescription(photo.getID());
			else if (visible.album()) album.setDescription(album.getID());
		});

	sidebar
		.dom("#edit_showtags")
		.off(eventName)
		.on(eventName, function () {
			album.setShowTags(album.getID());
		});

	sidebar
		.dom("#edit_tags")
		.off(eventName)
		.on(eventName, function () {
			photo.editTags([photo.getID()]);
		});

	sidebar
		.dom("#tags .tag")
		.off(eventName)
		.on(eventName, function () {
			sidebar.triggerSearch($(this).text());
		});

	sidebar
		.dom("#tags .tag span")
		.off(eventName)
		.on(eventName, function () {
			photo.deleteTag(photo.getID(), $(this).data("index"));
		});

	sidebar
		.dom("#edit_license")
		.off(eventName)
		.on(eventName, function () {
			if (visible.photo()) photo.setLicense(photo.getID());
			else if (visible.album()) album.setLicense(album.getID());
		});

	sidebar
		.dom("#edit_sorting")
		.off(eventName)
		.on(eventName, function () {
			album.setSorting(album.getID());
		});

	sidebar
		.dom(".attr_location")
		.off(eventName)
		.on(eventName, function () {
			sidebar.triggerSearch($(this).text());
		});

	sidebar
		.dom(".color")
		.off(eventName)
		.on(eventName, function () {
			sidebar.triggerSearch($(this).data('color'));
		});

	return true;
};

sidebar.triggerSearch = function (search_string) {
	// If public search is diabled -> do nothing
	if (lychee.publicMode === true && !lychee.public_search) {
		// Do not display an error -> just do nothing to not confuse the user
		return;
	}

	search.hash = null;
	// We're either logged in or public search is allowed
	lychee.goto("search/" + encodeURIComponent(search_string));
};

sidebar.toggle = function () {
	if (visible.sidebar() || visible.sidebarbutton()) {
		header.dom(".button--info").toggleClass("active");
		lychee.content.toggleClass("content--sidebar");
		lychee.imageview.toggleClass("image--sidebar");
		if (typeof view !== "undefined") view.album.content.justify();
		sidebar.dom().toggleClass("active");
		photo.updateSizeLivePhotoDuringAnimation();

		return true;
	}

	return false;
};

sidebar.setSelectable = function (selectable = true) {
	// Attributes/Values inside the sidebar are selectable by default.
	// Selection needs to be deactivated to prevent an unwanted selection
	// while using multiselect.

	if (selectable === true) sidebar.dom().removeClass("notSelectable");
	else sidebar.dom().addClass("notSelectable");
};

sidebar.changeAttr = function (attr, value = "-", dangerouslySetInnerHTML = false) {
	if (attr == null || attr === "") return false;

	// Set a default for the value
	if (value == null || value === "") value = "-";

	// Escape value
	if (dangerouslySetInnerHTML === false) value = lychee.escapeHTML(value);

	// Set new value
	sidebar.dom(".attr_" + attr).html(value);

	return true;
};

sidebar.hideAttr = function (attr) {
	sidebar
		.dom(".attr_" + attr)
		.closest("tr")
		.hide();
};

sidebar.secondsToHMS = function (d) {
	d = Number(d);
	var h = Math.floor(d / 3600);
	var m = Math.floor((d % 3600) / 60);
	var s = Math.floor(d % 60);

	return (h > 0 ? h.toString() + "h" : "") + (m > 0 ? m.toString() + "m" : "") + (s > 0 || (h == 0 && m == 0) ? s.toString() + "s" : "");
};

sidebar.createStructure.photo = function (data) {
	if (data == null || data === "") return false;

	let editable = typeof album !== "undefined" ? album.isUploadable() : false;
	let exifHash = data.taken_at + data.make + data.model + data.shutter + data.aperture + data.focal + data.iso;
	let locationHash = data.longitude + data.latitude + data.altitude;
	let structure = {};
	let _public = "";
	let isVideo = data.type && data.type.indexOf("video") > -1;
	let license;

	// Set the license string for a photo
	switch (data.license) {
		// if the photo doesn't have a license
		case "none":
			license = "";
			break;
		// Localize All Rights Reserved
		case "reserved":
			license = lychee.locale["PHOTO_RESERVED"];
			break;
		// Display anything else that's set
		default:
			license = data.license;
			break;
	}

	// Set value for public
	switch (data.public) {
		case "0":
			_public = lychee.locale["PHOTO_SHR_NO"];
			break;
		case "1":
			_public = lychee.locale["PHOTO_SHR_PHT"];
			break;
		case "2":
			_public = lychee.locale["PHOTO_SHR_ALB"];
			break;
		default:
			_public = "-";
			break;
	}

	structure.basics = {
		title: lychee.locale["PHOTO_BASICS"],
		type: sidebar.types.DEFAULT,
		rows: [
			{ title: lychee.locale["PHOTO_TITLE"], kind: "title", value: data.title, editable },
			{ title: lychee.locale["PHOTO_UPLOADED"], kind: "uploaded", value: lychee.locale.printDateTime(data.created_at) },
			{ title: lychee.locale["PHOTO_DESCRIPTION"], kind: "description", value: data.description, editable },
		],
	};

	structure.image = {
		title: lychee.locale[isVideo ? "PHOTO_VIDEO" : "PHOTO_IMAGE"],
		type: sidebar.types.DEFAULT,
		rows: [
			{ title: lychee.locale["PHOTO_SIZE"], kind: "size", value: lychee.locale.printFilesizeLocalized(data.filesize) },
			{ title: lychee.locale["PHOTO_FORMAT"], kind: "type", value: data.type },
			{ title: lychee.locale["PHOTO_RESOLUTION"], kind: "resolution", value: data.width + " x " + data.height },
		],
	};

	if (isVideo) {
		if (data.width === 0 || data.height === 0) {
			// Remove the "Resolution" line if we don't have the data.
			structure.image.rows.splice(-1, 1);
		}

		// We overload the database, storing duration (in full seconds) in
		// "aperture" and frame rate (floating point with three digits after
		// the decimal point) in "focal".
		if (data.aperture != "") {
			structure.image.rows.push({ title: lychee.locale["PHOTO_DURATION"], kind: "duration", value: sidebar.secondsToHMS(data.aperture) });
		}
		if (data.focal != "") {
			structure.image.rows.push({ title: lychee.locale["PHOTO_FPS"], kind: "fps", value: data.focal + " fps" });
		}
	}

	// Always create tags section - behaviour for editing
	//tags handled when contructing the html code for tags

	structure.tags = {
		title: lychee.locale["PHOTO_TAGS"],
		type: sidebar.types.TAGS,
		value: build.tags(data.tags),
		editable,
	};

	structure.palette = {
		title: lychee.locale["PHOTO_PALETTE"],
		type: sidebar.types.PALETTE,
		value: data.colors.length > 0 ? build.colors(data.colors) : '',
	}

	// Only create EXIF section when EXIF data available
	if (exifHash !== "") {
		structure.exif = {
			title: lychee.locale["PHOTO_CAMERA"],
			type: sidebar.types.DEFAULT,
			rows: isVideo
				? [
						{ title: lychee.locale["PHOTO_CAPTURED"], kind: "takedate", value: lychee.locale.printDateTime(data.taken_at) },
						{ title: lychee.locale["PHOTO_MAKE"], kind: "make", value: data.make },
						{ title: lychee.locale["PHOTO_TYPE"], kind: "model", value: data.model },
				  ]
				: [
						{ title: lychee.locale["PHOTO_CAPTURED"], kind: "takedate", value: lychee.locale.printDateTime(data.taken_at) },
						{ title: lychee.locale["PHOTO_MAKE"], kind: "make", value: data.make },
						{ title: lychee.locale["PHOTO_TYPE"], kind: "model", value: data.model },
						{ title: lychee.locale["PHOTO_LENS"], kind: "lens", value: data.lens },
						{ title: lychee.locale["PHOTO_SHUTTER"], kind: "shutter", value: data.shutter },
						{ title: lychee.locale["PHOTO_APERTURE"], kind: "aperture", value: data.aperture },
						{ title: lychee.locale["PHOTO_FOCAL"], kind: "focal", value: data.focal },
						{ title: lychee.locale["PHOTO_ISO"], kind: "iso", value: data.iso },
				  ],
		};
	} else {
		structure.exif = {};
	}

	structure.sharing = {
		title: lychee.locale["PHOTO_SHARING"],
		type: sidebar.types.DEFAULT,
		rows: [{ title: lychee.locale["PHOTO_SHR_PLUBLIC"], kind: "public", value: _public }],
	};

	structure.license = {
		title: lychee.locale["PHOTO_REUSE"],
		type: sidebar.types.DEFAULT,
		rows: [{ title: lychee.locale["PHOTO_LICENSE"], kind: "license", value: license, editable: editable }],
	};

	if (locationHash !== "" && locationHash !== 0) {
		structure.location = {
			title: lychee.locale["PHOTO_LOCATION"],
			type: sidebar.types.DEFAULT,
			rows: [
				{
					title: lychee.locale["PHOTO_LATITUDE"],
					kind: "latitude",
					value: data.latitude ? DecimalToDegreeMinutesSeconds(data.latitude, true) : "",
				},
				{
					title: lychee.locale["PHOTO_LONGITUDE"],
					kind: "longitude",
					value: data.longitude ? DecimalToDegreeMinutesSeconds(data.longitude, false) : "",
				},
				// No point in displaying sub-mm precision; 10cm is more than enough.
				{
					title: lychee.locale["PHOTO_ALTITUDE"],
					kind: "altitude",
					value: data.altitude ? (Math.round(parseFloat(data.altitude) * 10) / 10).toString() + "m" : "",
				},
				{ title: lychee.locale["PHOTO_LOCATION"], kind: "location", value: data.location ? data.location : "" },
			],
		};
		if (data.imgDirection) {
			// No point in display sub-degree precision.
			structure.location.rows.push({
				title: lychee.locale["PHOTO_IMGDIRECTION"],
				kind: "imgDirection",
				value: Math.round(data.imgDirection).toString() + "°",
			});
		}
	} else {
		structure.location = {};
	}

	// Construct all parts of the structure
	let structure_ret = [structure.basics, structure.image, structure.tags, structure.exif, structure.location, structure.license, structure.palette];

	if (!lychee.publicMode) {
		structure_ret.push(structure.sharing);
	}

	return structure_ret;
};

sidebar.createStructure.album = function (album) {
	let data = album.json;

	if (data == null || data === "") return false;

	let editable = album.isUploadable();
	let structure = {};
	let _public = "";
	let hidden = "";
	let downloadable = "";
	let share_button_visible = "";
	let password = "";
	let license = "";
	let sorting = "";

	// Set value for public
	switch (data.public) {
		case "0":
			_public = lychee.locale["ALBUM_SHR_NO"];
			break;
		case "1":
			_public = lychee.locale["ALBUM_SHR_YES"];
			break;
		default:
			_public = "-";
			break;
	}

	// Set value for hidden
	switch (data.visible) {
		case "0":
			hidden = lychee.locale["ALBUM_SHR_YES"];
			break;
		case "1":
			hidden = lychee.locale["ALBUM_SHR_NO"];
			break;
		default:
			hidden = "-";
			break;
	}

	// Set value for downloadable
	switch (data.downloadable) {
		case "0":
			downloadable = lychee.locale["ALBUM_SHR_NO"];
			break;
		case "1":
			downloadable = lychee.locale["ALBUM_SHR_YES"];
			break;
		default:
			downloadable = "-";
			break;
	}

	// Set value for share_button_visible
	switch (data.share_button_visible) {
		case "0":
			share_button_visible = lychee.locale["ALBUM_SHR_NO"];
			break;
		case "1":
			share_button_visible = lychee.locale["ALBUM_SHR_YES"];
			break;
		default:
			share_button_visible = "-";
			break;
	}

	// Set value for password
	switch (data.password) {
		case "0":
			password = lychee.locale["ALBUM_SHR_NO"];
			break;
		case "1":
			password = lychee.locale["ALBUM_SHR_YES"];
			break;
		default:
			password = "-";
			break;
	}

	// Set license string
	switch (data.license) {
		case "none":
			license = ""; // consistency
			break;
		case "reserved":
			license = lychee.locale["ALBUM_RESERVED"];
			break;
		default:
			license = data.license;
			break;
	}

	if (data.sorting_col === "") {
		sorting = lychee.locale["DEFAULT"];
	} else {
		sorting = data.sorting_col + " " + data.sorting_order;
	}

	structure.basics = {
		title: lychee.locale["ALBUM_BASICS"],
		type: sidebar.types.DEFAULT,
		rows: [
			{ title: lychee.locale["ALBUM_TITLE"], kind: "title", value: data.title, editable },
			{ title: lychee.locale["ALBUM_DESCRIPTION"], kind: "description", value: data.description, editable },
		],
	};

	if (album.isTagAlbum()) {
		structure.basics.rows.push({ title: lychee.locale["ALBUM_SHOW_TAGS"], kind: "showtags", value: data.show_tags, editable });
	}

	let videoCount = 0;
	$.each(data.photos, function () {
		if (this.type && this.type.indexOf("video") > -1) {
			videoCount++;
		}
	});
	structure.album = {
		title: lychee.locale["ALBUM_ALBUM"],
		type: sidebar.types.DEFAULT,
		rows: [{ title: lychee.locale["ALBUM_CREATED"], kind: "created", value: lychee.locale.printDateTime(data.created_at) }],
	};
	if (data.albums && data.albums.length > 0) {
		structure.album.rows.push({ title: lychee.locale["ALBUM_SUBALBUMS"], kind: "subalbums", value: data.albums.length });
	}
	if (data.photos) {
		if (data.photos.length - videoCount > 0) {
			structure.album.rows.push({ title: lychee.locale["ALBUM_IMAGES"], kind: "images", value: data.photos.length - videoCount });
		}
	}
	if (videoCount > 0) {
		structure.album.rows.push({ title: lychee.locale["ALBUM_VIDEOS"], kind: "videos", value: videoCount });
	}

	if (data.photos) {
		structure.album.rows.push({ title: lychee.locale["ALBUM_ORDERING"], kind: "sorting", value: sorting, editable: editable });
	}

	structure.share = {
		title: lychee.locale["ALBUM_SHARING"],
		type: sidebar.types.DEFAULT,
		rows: [
			{ title: lychee.locale["ALBUM_PUBLIC"], kind: "public", value: _public },
			{ title: lychee.locale["ALBUM_HIDDEN"], kind: "hidden", value: hidden },
			{ title: lychee.locale["ALBUM_DOWNLOADABLE"], kind: "downloadable", value: downloadable },
			{ title: lychee.locale["ALBUM_SHARE_BUTTON_VISIBLE"], kind: "share_button_visible", value: share_button_visible },
			{ title: lychee.locale["ALBUM_PASSWORD"], kind: "password", value: password },
		],
	};

	if (data.owner != null) {
		structure.share.rows.push({ title: lychee.locale["ALBUM_OWNER"], kind: "owner", value: data.owner });
	}

	structure.license = {
		title: lychee.locale["ALBUM_REUSE"],
		type: sidebar.types.DEFAULT,
		rows: [{ title: lychee.locale["ALBUM_LICENSE"], kind: "license", value: license, editable: editable }],
	};

	// Construct all parts of the structure
	let structure_ret = [structure.basics, structure.album, structure.license];
	if (!lychee.publicMode) {
		structure_ret.push(structure.share);
	}

	return structure_ret;
};

sidebar.has_location = function (structure) {
	if (structure == null || structure === "" || structure === false) return false;

	let _has_location = false;

	structure.forEach(function (section) {
		if (section.title == lychee.locale["PHOTO_LOCATION"]) {
			_has_location = true;
		}
	});

	return _has_location;
};

sidebar.render = function (structure) {
	if (structure == null || structure === "" || structure === false) return false;

	let html = "";

	let renderDefault = function (section) {
		let _html = "";

		_html += `
				 <div class='sidebar__divider'>
					 <h1>${section.title}</h1>
				 </div>
				 <table>
				 `;

		if (section.title == lychee.locale["PHOTO_LOCATION"]) {
			let _has_latitude = false;
			let _has_longitude = false;

			section.rows.forEach(function (row, index, object) {
				if (row.kind == "latitude" && row.value !== "") {
					_has_latitude = true;
				}

				if (row.kind == "longitude" && row.value !== "") {
					_has_longitude = true;
				}

				// Do not show location is not enabled
				if (row.kind == "location" && ((lychee.publicMode === true && !lychee.location_show_public) || !lychee.location_show)) {
					object.splice(index, 1);
				} else {
					// Explode location string into an array to keep street, city etc separate
					if (!(row.value === "" || row.value == null)) {
						section.rows[index].value = row.value.split(",").map(function (item) {
							return item.trim();
						});
					}
				}
			});

			if (_has_latitude && _has_longitude && lychee.map_display) {
				_html += `
						 <div id="leaflet_map_single_photo"></div>
						 `;
			}
		}

		section.rows.forEach(function (row) {
			let value = row.value;

			// show only Exif rows which have a value or if its editable
			if (!(value === "" || value == null) || row.editable === true) {
				// Wrap span-element around value for easier selecting on change
				if (Array.isArray(row.value)) {
					value = "";
					row.value.forEach(function (v) {
						if (v === "" || v == null) {
							return;
						}
						// Add separator if needed
						if (value !== "") {
							value += lychee.html`<span class='attr_${row.kind}_separator'>, </span>`;
						}
						value += lychee.html`<span class='attr_${row.kind} search'>$${v}</span>`;
					});
				} else {
					value = lychee.html`<span class='attr_${row.kind}'>$${value}</span>`;
				}

				// Add edit-icon to the value when editable
				if (row.editable === true) value += " " + build.editIcon("edit_" + row.kind);

				_html += lychee.html`
						 <tr>
							 <td>${row.title}</td>
							 <td>${value}</td>
						 </tr>
						 `;
			}
		});

		_html += `
				 </table>
				 `;

		return _html;
	};

	let renderTags = function (section) {
		let _html = "";
		let editable = "";

		// Add edit-icon to the value when editable
		if (section.editable === true) editable = build.editIcon("edit_tags");

		_html += lychee.html`
				 <div class='sidebar__divider'>
					 <h1>${section.title}</h1>
				 </div>
				 <div id='tags'>
					 <div class='attr_${section.title.toLowerCase()}'>${section.value}</div>
					 ${editable}
				 </div>
				 `;

		return _html;
	};

	let renderPalette = function (section) {
		let _html = "";
		_html += lychee.html`
				<div class='sidebar__divider'>
					 <h1>${section.title}</h1>
				</div>
				<div class='palette'>
				 	${section.value}
				</div>
		`;
		return _html;
	}

	structure.forEach(function (section) {
		if (section.type === sidebar.types.DEFAULT) html += renderDefault(section);
		else if (section.type === sidebar.types.TAGS) html += renderTags(section);
		else if (section.type === sidebar.types.PALETTE && section.value !== '') html += renderPalette(section);
	});

	return html;
};

function DecimalToDegreeMinutesSeconds(decimal, type) {
	let degrees = 0;
	let minutes = 0;
	let seconds = 0;
	let direction;

	//decimal must be integer or float no larger than 180;
	//type must be Boolean
	if (Math.abs(decimal) > 180 || typeof type !== "boolean") {
		return false;
	}

	//inputs OK, proceed
	//type is latitude when true, longitude when false

	//set direction; north assumed
	if (type && decimal < 0) {
		direction = "S";
	} else if (!type && decimal < 0) {
		direction = "W";
	} else if (!type) {
		direction = "E";
	} else {
		direction = "N";
	}

	//get absolute value of decimal
	let d = Math.abs(decimal);

	//get degrees
	degrees = Math.floor(d);

	//get seconds
	seconds = (d - degrees) * 3600;

	//get minutes
	minutes = Math.floor(seconds / 60);

	//reset seconds
	seconds = Math.floor(seconds - minutes * 60);

	return degrees + "° " + minutes + "' " + seconds + '" ' + direction;
}
