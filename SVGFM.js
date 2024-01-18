const svgNS = 'http://www.w3.org/2000/svg'; // I'm lazy
const fePrimRef = '<filter-primitive-reference>';

/**
 * @typedef {Object} Coordinates X and Y coordinates object.
 * @param {Number} x Horizontal coordinate.
 * @param {Number} y Vertical coordinate.
 */

/**
 * Dirty little helper to create a new element with attributes in a single call.
 * @param {string} tag Element node name to create.
 * @param {object} attrs Attributes to assign to the created element.
 * @param {'svg'|'html'} [ns] Optional. The namespace for the element, such as SVG. Uses HTML by default.
 * @returns {HTMLElement} New element.
 */
function el(tag, attrs, ns = 'html') {
	if (tag === 'a' && !attrs.hasOwnProperty('href')) {
		throw 'Anchor element require a `href` attribute!';
	}
	if (tag === 'img' && !attrs.hasOwnProperty('alt')) {
		throw 'Image element require an `alt` attribute!';
	}

	if (ns === 'svg') {
		const newEl = document.createElementNS(svgNS, tag);
		for (let attr in attrs) {
			newEl.setAttribute(attr, attrs[attr]);
		}
		return newEl;
	}

	return Object.assign(document.createElement(tag), attrs);
}

/**
 * Removes all children inside an element.
 * @param {HTMLElement} el Element to empty.
 */
function emptyEl(el) {
	while (el.firstChild) {
		el.removeChild(el.firstChild);
	}
}

/**
 * Trigger a change on the target element.
 * @param {HTMLElement} el Element from which to trigger the event.
 */
function triggerChange(el) {
	const changeEvent = new Event('change', { bubbles: true });
	el.dispatchEvent(changeEvent);
}

/**
 * Injects indentation according to an element's nested level (mutates the DOM element, does not return a value).
 * @param {HTMLElement} dom HTML Element with nested children to adjust.
 * @param {Number} [level] Optional. The tabulation offset to use. Defaults to `0`.
 */
function autoTab(dom, level = 0) {
	Array.from(dom.children).forEach((c) => {
		dom.insertBefore(document.createTextNode(`\n${'\t'.repeat(level)}`), c);

		// Adds correct spacing before multi-line attribute
		const cAttrs = Array.from(c.attributes);
		if (cAttrs.some((attr) => attr.nodeValue.includes('\n'))) {
			const lineBreakAttr = cAttrs.find((attr) => attr.nodeValue.includes('\n'));
			const lineBreakAttrName = lineBreakAttr.nodeName;
			const lineBreakAttrString = ` ${lineBreakAttrName}="`;
			const lineBreakMatch = c.outerHTML.split('\n').find((line) => line.includes(lineBreakAttrString));
			const lineBreakIndex = lineBreakMatch.indexOf(lineBreakAttrString);
			const lineBreakOffset = lineBreakAttrString.length + lineBreakIndex;
			const offsetAttrValue = lineBreakAttr.nodeValue.split('\n').join(`\n${'\t'.repeat(level)}${' '.repeat(lineBreakOffset)}`);
			lineBreakAttr.nodeValue = offsetAttrValue;
		}

		// If it's the last element
		if (!c.nextSibling) {
			dom.insertBefore(document.createTextNode(`\n${'\t'.repeat(Math.max(0, level - 1))}`), c.nextSibling);
		}
		autoTab(c, level + 1);
	});
}

/**
 * Generates a unique ID with options to prefix a namespace to it and/or make it a short UUID.
 * @param {string} [prefix] Optional. Namespace for the ID.
 * @param {boolean} [short] Optional. Whether the UUID returned should be short (might cause collisions in rare cases). Defaults to `false`.
 * @returns {string} Generated unique ID.
 */
function generateId(prefix = '', short = false) {
	const parts = [];
	prefix = prefix.trim();

	if (prefix) {
		parts.push(prefix);
	}
	let uuid = crypto.randomUUID();
	if (short) {
		uuid = uuid.split('-')[0]; // Grab only the first set of characters
	}
	parts.push(uuid);
	return parts.join('-');
}

/**
 * Clamps a number, with a CSS function signature. If `min > max`, their values are swapped.
 * @param {Number} min Lowest accepted number.
 * @param {Number} num Number to clamp.
 * @param {Number} max Greatest accepted number.
 * @returns {Number} Clamped number.
 */
function MathClamp(min, num, max) {
	if (min > max) {
		[max, min] = [min, max]; // Swap the numbers if the min is greater than the max
	}
	return Math.min(Math.max(num, min), max);
}

/**
 * Rounds a number to a provided step value
 * @param {Number} num Number to "stepify".
 * @param {Number} [step] Optional. The step size to use, converted into its absolute value. Defaults to `10`.
 * @returns {Number} Stepped number.
 */
function MathStep(num, step = 10) {
	step = Math.abs(step);
	return Math.round(num / step) * step;
}

/**
 * Deduplicates array items.
 * @param {array} array The array to deduplicate.
 * @returns {array} Deduplicated array.
 */
function ArrayUnique(array) {
	return Array.from(new Set(array));
}

/**
 * Finds the position of an element, optionally in relation to a reference element.
 * @param {HTMLElement} element Element for which to get the position coordinates.
 * @param {HTMLElement} [reference] Optional. Which element to consider the outer boundary. Default to the document body element.
 * @returns {Coordinates} How far the element's top-left edge is from the reference's top-left.
 */
function getElementPosition(element, reference = document.body) {
	let x = 0;
	let y = 0;

	if (element.offsetParent && reference.contains(element)) {
		while (element) {
			x += element.offsetLeft;
			y += element.offsetTop;
			element = element.offsetParent;

			if (element === reference) {
				break;
			}
		}
	}

	return { x, y };
}

/**
 * Retrieve the offset between a clicked element's click-point and top-left corner.
 * @param {Event} e Event instance.
 * @param {HTMLElement} target Target element to compare.
 * @returns {Coordinates} How far the click was from the target element's top-left edge.
 */
function getClickOffset(e, target) {
	const eventX = e.clientX;
	const eventY = e.clientY;

	// If this is from an element that scrolls, compensate for its scroll position
	const scrollX = target.closest('.app-sidebar-inner')?.scrollLeft || 0;
	const scrollY = target.closest('.app-sidebar-inner')?.scrollTop || 0;

	const targetX = target.offsetLeft - scrollX;
	const targetY = target.offsetTop - scrollY;

	const returnedOffsets = {
		x: eventX - targetX,
		y: eventY - targetY,
	};

	return returnedOffsets;
}

/**
 * Retrieves the data from all the named fields of a form.
 * @param {HTMLFormElement} form The form from which to retrieve the data.
 * @returns {object} The collected form data.
 */
function getFormData(form) {
	if (!form || !(form instanceof HTMLFormElement)) {
		throw 'The provided form is not a form element.';
	}
	return Object.fromEntries(new FormData(form).entries());
}

/**
 * Converts a string to title case.
 * @param {string} str String to convert.
 * @returns {string} Titlecased string.
 */
function toTitleCase(str) {
	return str
		.split(' ')
		.map((part) => ''.concat(part.substr(0, 1).toUpperCase(), part.slice(1)))
		.join(' ');
}

/**
 * Converts a named color to its hexadecimal value, or returns the map for named and hex values.
 * @param {string} [name] Optional. The color name to convert. If omitted, the full list of colors is returned.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/named-color MDN's Named colors list}
 * @returns {string|false|object} The color if there was a match, `false` if not, or the color list if `name` was omitted.
 */
function namedColorToHex(name = null) {
	const list = {
		black: '#000000',
		silver: '#c0c0c0',
		gray: '#808080',
		white: '#ffffff',
		maroon: '#800000',
		red: '#ff0000',
		purple: '#800080',
		fuchsia: '#ff00ff',
		green: '#008000',
		lime: '#00ff00',
		olive: '#808000',
		yellow: '#ffff00',
		navy: '#000080',
		blue: '#0000ff',
		teal: '#008080',
		aqua: '#00ffff',
		aliceblue: '#f0f8ff',
		antiquewhite: '#faebd7',
		aquamarine: '#7fffd4',
		azure: '#f0ffff',
		beige: '#f5f5dc',
		bisque: '#ffe4c4',
		blanchedalmond: '#ffebcd',
		blueviolet: '#8a2be2',
		brown: '#a52a2a',
		burlywood: '#deb887',
		cadetblue: '#5f9ea0',
		chartreuse: '#7fff00',
		chocolate: '#d2691e',
		coral: '#ff7f50',
		cornflowerblue: '#6495ed',
		cornsilk: '#fff8dc',
		crimson: '#dc143c',
		cyan: '#00ffff',
		darkblue: '#00008b',
		darkcyan: '#008b8b',
		darkgoldenrod: '#b8860b',
		darkgray: '#a9a9a9',
		darkgreen: '#006400',
		darkgrey: '#a9a9a9',
		darkkhaki: '#bdb76b',
		darkmagenta: '#8b008b',
		darkolivegreen: '#556b2f',
		darkorange: '#ff8c00',
		darkorchid: '#9932cc',
		darkred: '#8b0000',
		darksalmon: '#e9967a',
		darkseagreen: '#8fbc8f',
		darkslateblue: '#483d8b',
		darkslategray: '#2f4f4f',
		darkslategrey: '#2f4f4f',
		darkturquoise: '#00ced1',
		darkviolet: '#9400d3',
		deeppink: '#ff1493',
		deepskyblue: '#00bfff',
		dimgray: '#696969',
		dimgrey: '#696969',
		dodgerblue: '#1e90ff',
		firebrick: '#b22222',
		floralwhite: '#fffaf0',
		forestgreen: '#228b22',
		gainsboro: '#dcdcdc',
		ghostwhite: '#f8f8ff',
		gold: '#ffd700',
		goldenrod: '#daa520',
		greenyellow: '#adff2f',
		grey: '#808080',
		honeydew: '#f0fff0',
		hotpink: '#ff69b4',
		indianred: '#cd5c5c',
		indigo: '#4b0082',
		ivory: '#fffff0',
		khaki: '#f0e68c',
		lavender: '#e6e6fa',
		lavenderblush: '#fff0f5',
		lawngreen: '#7cfc00',
		lemonchiffon: '#fffacd',
		lightblue: '#add8e6',
		lightcoral: '#f08080',
		lightcyan: '#e0ffff',
		lightgoldenrodyellow: '#fafad2',
		lightgray: '#d3d3d3',
		lightgreen: '#90ee90',
		lightgrey: '#d3d3d3',
		lightpink: '#ffb6c1',
		lightsalmon: '#ffa07a',
		lightseagreen: '#20b2aa',
		lightskyblue: '#87cefa',
		lightslategray: '#778899',
		lightslategrey: '#778899',
		lightsteelblue: '#b0c4de',
		lightyellow: '#ffffe0',
		limegreen: '#32cd32',
		linen: '#faf0e6',
		magenta: '#ff00ff',
		mediumaquamarine: '#66cdaa',
		mediumblue: '#0000cd',
		mediumorchid: '#ba55d3',
		mediumpurple: '#9370db',
		mediumseagreen: '#3cb371',
		mediumslateblue: '#7b68ee',
		mediumspringgreen: '#00fa9a',
		mediumturquoise: '#48d1cc',
		mediumvioletred: '#c71585',
		midnightblue: '#191970',
		mintcream: '#f5fffa',
		mistyrose: '#ffe4e1',
		moccasin: '#ffe4b5',
		navajowhite: '#ffdead',
		oldlace: '#fdf5e6',
		olivedrab: '#6b8e23',
		orange: '#ffa500',
		orangered: '#ff4500',
		orchid: '#da70d6',
		palegoldenrod: '#eee8aa',
		palegreen: '#98fb98',
		paleturquoise: '#afeeee',
		palevioletred: '#db7093',
		papayawhip: '#ffefd5',
		peachpuff: '#ffdab9',
		peru: '#cd853f',
		pink: '#ffc0cb',
		plum: '#dda0dd',
		powderblue: '#b0e0e6',
		rebeccapurple: '#663399',
		rosybrown: '#bc8f8f',
		royalblue: '#4169e1',
		saddlebrown: '#8b4513',
		salmon: '#fa8072',
		sandybrown: '#f4a460',
		seagreen: '#2e8b57',
		seashell: '#fff5ee',
		sienna: '#a0522d',
		skyblue: '#87ceeb',
		slateblue: '#6a5acd',
		slategray: '#708090',
		slategrey: '#708090',
		snow: '#fffafa',
		springgreen: '#00ff7f',
		steelblue: '#4682b4',
		tan: '#d2b48c',
		thistle: '#d8bfd8',
		tomato: '#ff6347',
		turquoise: '#40e0d0',
		violet: '#ee82ee',
		wheat: '#f5deb3',
		whitesmoke: '#f5f5f5',
		yellowgreen: '#9acd32',
		transparent: 'transparent',
		inherit: 'inherit',
		none: 'none',
		currentcolor: 'currentColor',
	};

	if (!name) {
		return list;
	}

	return list[name.toLowerCase()] || false; // Lowercase ensures cases like `currentColor` can still be mapped correctly
}

/**
 * Get the actual type of a value.
 * @param {*} val The value to check.
 * @returns {string} Lowecase name of the value's true type.
 */
function trueType(val) {
	return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}

class SVGFM {
	/** Scaffhold the app
	 * @param {HTMLElement|string} container The app container, passed as a CSS selector, or a HTML element reference.
	 * @param {object} config External configuration data used to set up the app.
	 */
	constructor(container, config) {
		this.app = typeof container === 'string' ? document.querySelector(container) : container; // Store a reference to the app container
		this.dropTarget = false; // This will be used in drag-and-drop operations to keep track of where the dragged element was dropped
		this.inputSelectorList = `input:where([type="text"], [type="url"], [type="number"], [type="color"], [type="radio"]), textarea, select, output`;
		this.localStorageKeys = {
			graph: 'SVGFM_Graph',
			dragAndDrop: 'SVGFM_DragAndDropData',
		};
		this.arrowKeyDelta = 10; // Arrow keys move nodes by this many pixels

		// Set up the markup
		this.app.innerHTML = ''; // Let's empty the app "canvas" first to remove the loading message
		this.sidebar = el('div', { className: 'app-sidebar' });
		this.sidebarInner = el('div', { className: 'app-sidebar-inner', id: 'app-sidebar-inner' });
		this.graph = el('div', { className: 'app-graph' });
		this.graphLines = el('svg', { class: 'app-graph-lines', xmlns: svgNS, 'aria-hidden': 'true' }, 'svg');
		this.graph.append(this.graphLines);
		this.preview = el('div', { className: 'app-preview' });
		this.previewCode = el('textarea', { readOnly: true, className: 'app-preview-code', id: 'app-preview-code' });
		this.previewCodeLabel = el('label', { innerText: 'Code Output', className: 'visually-hidden', htmlFor: 'app-preview-code' });
		this.previewConfig = el('div', { className: 'app-preview-config' });
		this.app.append(this.sidebar, this.graph, this.preview);
		this.sidebar.append(this.sidebarInner);
		this.preview.append(this.previewCodeLabel, this.previewCode, this.previewConfig);

		// Set up a active node store (accessed by key as the node reference)
		this.activeNodes = {};

		// Collect all nodes
		const attrs = config.attrMap.primitives.map((p) => Object.assign({ category: 'primitives' }, p));
		const maths = config.mathsMap.map((p) => Object.assign({ category: 'maths' }, p));
		const inputs = config.inputsMap.map((p) => Object.assign({ category: 'inputs' }, p));
		this.nodes = [].concat(attrs, maths, inputs);

		// List categories
		this.categories = ArrayUnique(this.nodes.map((node) => node.category)).map((cat) => {
			const catLabel = (config.categoryLabels ? config.categoryLabels[cat] : null) || toTitleCase(cat);
			return { ref: cat, label: catLabel };
		});

		// Register unit control options
		this.unitOptions = config.attrMap.unitOptions; // TODO Move this into each primitive object instead, akin to how `conditions` exists within each attribute directly (repetitive, but cleaner)

		// Register all event listeners
		this.app.addEventListener('dragstart', this);
		this.app.addEventListener('dragend', this);
		this.app.addEventListener('dragenter', this);
		this.app.addEventListener('dragover', this);
		this.app.addEventListener('dragleave', this);
		this.app.addEventListener('drag', this);
		this.app.addEventListener('drop', this);
		this.app.addEventListener('focusin', this); // Bubbles! `focus` does not
		this.app.addEventListener('submit', this);
		this.app.addEventListener('change', this);
		this.app.addEventListener('click', this);
		this.app.addEventListener('dblclick', this);
		this.app.addEventListener('keydown', this);
		this.app.addEventListener('keyup', this);

		document.addEventListener('keydown', this);
		document.addEventListener('keyup', this);
		document.addEventListener('visibilitychange', this);
		window.addEventListener('focusout', this);

		// Initialize the app
		this.init();

		return this; // Not good practice buuuut super useful for testing so *shrug emoji*
	}

	/** Sets up the app's initial state */
	init() {
		this.app.classList.add('defined');

		// Add a datalist for named colors to be referenced for color inputs
		this.colorList = el('datalist', { id: 'named-color-list' });
		for (let color in namedColorToHex()) {
			this.colorList.append(el('option', { value: color }));
		}
		this.app.append(this.colorList);
		const uiSvgIcons = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true">
			<defs>
				<symbol id="icon-question" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="arcs"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></g></symbol>
				<symbol id="icon-eye" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="arcs"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></g></symbol>
				<symbol id="icon-close" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="arcs"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></g></symbol></symbol>
			</defs>
		</svg>`;
		let temp = el('div', { innerHTML: uiSvgIcons });
		this.app.append(temp.firstChild);
		temp.remove();
		temp = undefined;

		// Populate the sidebar
		const sideBarToolbar = el('div', { className: 'app-sidebar-toolbar' });
		const sideBarTitle = el('h2', { innerText: 'Nodes' });
		const sideBarToggle = el('button', { className: 'button-reset button-toggle app-sidebar-toggle', ariaControls: this.sidebarInner.id, ariaExpanded: true });
		sideBarToggle.innerHTML = `
			<span class="visually-hidden">Toggle Sidebar</span>
			<svg aria-hidden="true" data-toolbar-toggle="open" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="arcs"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
			<svg aria-hidden="true" data-toolbar-toggle="close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="arcs"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
		`;
		sideBarToolbar.append(sideBarTitle, sideBarToggle);
		this.sidebarInner.append(sideBarToolbar);
		this.sidebarDetails = [];
		this.categories.forEach((cat) => {
			const detailsEl = el('details', { id: cat.ref, open: true });
			const summaryEl = el('summary', { className: 'h3', innerText: cat.label });
			const listEl = el('ul', { className: 'app-nodes-list' });

			this.sidebarInner.append(detailsEl);
			this.sidebarDetails.push(detailsEl);
			detailsEl.append(summaryEl, listEl);

			const availableNodes = this.nodes.filter((node) => node.category === cat.ref);
			availableNodes.forEach((node) => {
				const nodeNested = !!node.nested;
				const listItem = el('li', { className: 'app-nodes-item' });
				const nodeTile = this.addTemplateTile();
				listItem.hidden = nodeNested; // Hide the item if it's only used as a nested item
				nodeTile.setAttribute('data-node-ref', node.ref);
				nodeTile.setAttribute('aria-roledescription', `Draggable template node for ${node.ref}`);
				Object.assign(this.elData(nodeTile), { nodeRef: node.ref, nodeCategory: cat.ref, nested: node.nested });

				// Append the node template to the list
				nodeTile.append(el('span', { className: 'app-tile__label', innerText: node.label }));
				listItem.append(nodeTile);
				listEl.append(listItem);
			});
		});

		// Add the preview resizer
		this.preview.append(el('div', { className: 'app-preview-resizer', draggable: true }));

		// Populate the preview form
		this.previewForm = el('form', { ariaLabel: 'Preview', className: 'app-preview-form' });
		const previewFormLegend = el('legend', { innerText: 'Source Graphic:', className: 'font-bold' });
		const previewFormLabelImage = el('label', { htmlFor: 'filter-preview-image', className: 'app-preview-form-option' });
		const previewFormLabelText = el('label', { htmlFor: 'filter-preview-text', className: 'app-preview-form-option' });
		const previewFormLabelCustom = el('label', { htmlFor: 'filter-preview-custom', className: 'app-preview-form-option' });
		const previewFormOptionImage = el('input', { type: 'radio', name: 'filter-preview-type', value: 'image', id: 'filter-preview-image', checked: true });
		const previewFormOptionText = el('input', { type: 'radio', name: 'filter-preview-type', value: 'text', id: 'filter-preview-text' });
		const previewFormOptionCustom = el('input', { type: 'radio', name: 'filter-preview-type', value: 'custom', id: 'filter-preview-custom' });
		const previewFormSpanImage = el('span', { innerText: 'Image' });
		const previewFormSpanText = el('span', { innerText: 'Text' });
		const previewFormSpanCustom = el('span', { innerText: 'Custom Code' });
		previewFormLabelImage.append(previewFormOptionImage, previewFormSpanImage);
		previewFormLabelText.append(previewFormOptionText, previewFormSpanText);
		previewFormLabelCustom.append(previewFormOptionCustom, previewFormSpanCustom);
		this.previewForm.append(previewFormLegend, previewFormLabelImage, previewFormLabelText /*previewFormLabelCustom*/);
		this.previewWindow = el('div', { className: 'app-preview-window' });
		this.previewConfig.append(this.previewForm, this.previewWindow);

		this.sidebarInner.setAttribute('data-dropzone', 'delete'); // Dropping into sidebar will delete a node
		this.graph.setAttribute('data-dropzone', 'nodes'); // Dropping into the graph will add a new node or move an existing one

		// If there is a stored config, restore it
		if (this.storedGraph) {
			this.populateGraph(this.storedGraph); // TODO
		}

		// Render the UI in the initial state
		this.render();
	}

	/**
	 * Interface to attach and retrieve data on elements.
	 * @param {HTMLElement} element Element from which to retrieve data.
	 * @returns {object} The element's data object. */
	elData(element) {
		// If the element does not have its initial data store, create it
		if (!element.hasOwnProperty('_svgfm')) {
			element._svgfm = {};
		}

		return element._svgfm;
	}

	/**
	 * Retrieves the current value of the localStorage item with the provided key.
	 * @returns {*}
	 */
	getFromLocalStorage(key) {
		const value = window.localStorage.getItem(this.localStorageKeys[key]);
		return value ? JSON.parse(value) : null;
	}

	/**
	 * Assigns the value of the localStorage item with the provided key. Clears the item if the value is undefined.
	 * @param {*} value The value of the localStorage item.
	 */
	updateLocalStorage(key, value) {
		if (value === undefined) {
			window.localStorage.removeItem(this.localStorageKeys[key]);
		} else {
			window.localStorage.setItem(this.localStorageKeys[key], JSON.stringify(value));
		}
	}

	// We only need this because some browsers misbehave, yeah baby yeah!
	get dataTransfer() {
		return this.getFromLocalStorage('dragAndDrop');
	}
	set dataTransfer(value) {
		this.updateLocalStorage('dragAndDrop', value);
	}

	get storedGraph() {
		return this.getFromLocalStorage('graph');
	}
	set storedGraph(value) {
		this.updateLocalStorage('graph', value);
	}

	/** Create a standard Template Tile which can be dragged from the Sidebar into the Graph */
	addTemplateTile() {
		const templateTile = el('div', { className: 'app-tile app-template-tile', draggable: true, tabIndex: '0', role: 'button' });
		templateTile.setAttribute('data-element', 'template');
		this.elData(templateTile).tileType = 'template';
		return templateTile;
	}

	/** Creates a new instance of a Node Tile */
	addNodeTile(config) {
		const nodeConfig = this.nodes.find((n) => n.ref === config.ref);
		const nodeData = Object.assign({ uniqueRef: generateId('node') }, nodeConfig);

		// Create the node and store its instance
		const node = el('div', { className: 'app-tile app-node-tile', id: nodeData.uniqueRef, tabIndex: '0', draggable: true });
		nodeData.element = node;

		// Store the node config and instance
		Object.assign(this.elData(node), {
			node: node, // Self-reference so we can do this.elData(x).node on any element
			tileType: 'node',
			nodeRef: config.ref,
			uniqueRef: nodeData.uniqueRef,
			config: nodeConfig,
		});

		// Create a form to control the attributes in the tile
		const nodeForm = this.buildTileForm(nodeData);

		// Store the form instance
		this.elData(node).form = nodeForm;

		node.setAttribute('data-element', 'node');
		nodeForm.setAttribute('data-element', 'form');

		// Position the node
		this.repositionNodeTile(node, config.x, config.y);
		return node;
	}

	/** Create a form for each type of input */
	buildTileForm(nodeData) {
		const nodeType = nodeData.ref;
		const form = el('form', { className: 'app-node-tile__form' });
		const title = el('p', { className: 'app-node-tile__title app-tile__label', id: `formtitle-${nodeData.uniqueRef}` });
		title.append(el('span', { innerText: nodeData.label }));
		form.setAttribute('aria-labelledby', title.id);
		nodeData.element.append(form);

		// Initialize controls and conditions
		Object.assign(this.elData(form), {
			node: nodeData.element,
			controls: {},
			conditions: {},
		});

		// For SVG primitives, add a help link to the MDN docs
		if (nodeData.category === 'primitives') {
			title.append(
				el('a', {
					href: `https://developer.mozilla.org/en-US/docs/Web/SVG/Element/${nodeData.ref}`,
					ariaLabel: `${nodeData.ref} element on MDN`,
					title: `${nodeData.ref} element on MDN`,
					innerHTML: '<svg width="12" height="12" aria-hidden="true"><use href="#icon-question" /></svg>',
					target: '_blank',
					className: 'help-link',
				})
			);
		}
		const hiddenType = el('input', { type: 'hidden', name: '_node-type', value: nodeType });
		const hiddenRef = el('input', { type: 'hidden', name: '_node-ref', value: nodeData.uniqueRef });

		form.append(title, hiddenType, hiddenRef);

		// Keep track of the controls present in the form
		let controls = {};
		let attrsFlat = [];
		let conditionalControls = {};

		// Loop over every attribute in the node
		for (let attr in nodeData.attrs) {
			const controlWrap = el('div', { className: 'app-node-tile__control-wrap' });
			const controlField = el('div', { className: 'app-node-tile__control' });

			const attrConfig = nodeData.attrs[attr];
			const attrData = attrConfig.attrType;
			const generatedControl = this.buildAttrControl({ attrs: nodeData.attrs, nodeType, attr, attrConfig, form, controlWrap, controlField, isSubControl: false });
			const conditions = attrConfig.conditions || null;
			const controlGuid = generatedControl.controlGuid;
			const appendableElement = generatedControl.appendableElement;
			const controlInput = generatedControl.controlInput;
			const globalType = generatedControl.globalType;
			const valueType = generatedControl.valueType;
			const subControls = generatedControl.subControls;
			const subControlsLocation = generatedControl.subControlsLocation;
			Object.assign(this.elData(controlWrap), { controlWrap, controlField, controlInput, subControls, conditions });
			Object.assign(this.elData(controlField), { controlWrap, controlField, controlInput, subControls, conditions });

			let labelText = attrConfig.label || attrData.label || attr;
			const labelWrap = el('div', { className: 'app-node-tile__control-label-wrap' });
			const label = el('label', {
				innerHTML: `<span class="app-node-tile__control-label-error">Invalid ${globalType}:</span> <span>${labelText}</span>`,
				className: 'app-node-tile__control-label',
				htmlFor: controlGuid,
				title: attr, // Not very useful so I'm okay with using the title attribute here
			});

			labelWrap.append(label);
			controlWrap.append(labelWrap);

			controlWrap.setAttribute('data-element', 'control-wrap');
			controlField.setAttribute('data-element', 'control');
			labelWrap.setAttribute('data-element', 'label-wrap');
			label.setAttribute('data-element', 'label');

			if (globalType === 'color' && !attrConfig.computed) {
				const customControl = el('div', { className: 'custom-input' });
				const colorInputWrap = el('div', { className: 'custom-input-colorwrap' });
				const colorInput = el('input', { type: 'color', value: controlInput.value, id: generateId() });

				this.elData(controlInput).bindingOutput = true;
				this.elData(controlInput).binding = colorInput;
				this.elData(colorInput).binding = controlInput;
				this.elData(colorInput).bindingOutput = false;
				this.elData(customControl).customControl = {
					inputType: 'color',
					customWrap: colorInputWrap,
					textInput: controlInput,
					colorInput: colorInput,
				};

				customControl.style.setProperty('--c', controlInput.value);

				colorInput.setAttribute('data-input-binding', controlInput.id);
				colorInput.setAttribute('data-color-input-pair-item', 'picker');
				controlInput.setAttribute('data-input-binding', colorInput.id);
				controlInput.setAttribute('data-color-input-pair-item', 'text');
				customControl.setAttribute('data-custom-input-type', 'color');

				controlField.append(customControl);
				colorInputWrap.append(colorInput);
				customControl.append(colorInputWrap, controlInput);
			} else if (appendableElement) {
				controlField.append(appendableElement);
			} else {
				controlField.append(controlInput);
			}

			this.elData(controlField).input = controlInput;

			// Attach the conditions attribute
			if (conditions) {
				controlWrap.setAttribute('data-control-conditions', JSON.stringify(conditions));
				conditionalControls[attr] = conditions;
			}

			controlInput.setAttribute('data-control-type', valueType);
			controlInput.setAttribute('data-port-type', globalType);
			controlInput.classList.add('app-node-tile__controlinput');

			// If data can flow from port to port
			if (attrConfig.flow || attrData.flow) {
				this.addFlowPorts(controlField, controlInput.id, attrConfig.flow || attrData.flow, {
					valueType: valueType,
					type: globalType,
					relation: attrConfig.attrType.flowRelation,
				});
			}

			// If there is unit options for the provided node type
			if (this.unitOptions.hasOwnProperty(attr)) {
				const attrUnitOptions = this.unitOptions[attr];
				if (attrUnitOptions.primitives.includes(nodeType)) {
					this.createUnitController({ controlField: controlField, label: labelWrap, input: controlInput, form: form }, attrUnitOptions);
				}
			}

			// Add a preview button if there is a Result attribute
			if (attr === 'result') {
				const nodePreviewTrigger = el('button', {
					type: 'button',
					className: 'app-node-tile__preview-button',
					draggable: true,
					innerHTML: `<svg width="12" height="12" aria-hidden="true">
						<use href="#icon-eye" class="app-node-tile__preview-icon app-node-tile__preview-icon--when-hidden" />
						<use href="#icon-close" class="app-node-tile__preview-icon app-node-tile__preview-icon--when-shown" />
					</svg>
					<span class="visually-hidden">Preview filter at this step</span>`,
				});
				labelWrap.append(nodePreviewTrigger);
			}

			controlWrap.setAttribute('data-control-attr', attr);
			controlWrap.append(controlField);

			// Add a link to the attribute reference
			if (!attrConfig.isCustomAttribute && nodeData.category === 'primitives') {
				labelWrap.append(
					el('a', {
						href: `https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/${attr}`,
						ariaLabel: `${attr} attribute on MDN`,
						title: `${attr} attribute on MDN`,
						innerHTML: '<svg width="12" height="12" aria-hidden="true"><use href="#icon-question" /></svg>',
						target: '_blank',
						className: 'help-link',
					})
				);
			}

			// Inject sub-controls
			if (subControls) {
				if (subControlsLocation[0] === 'outer') {
					if (subControlsLocation[1] === 'before') {
						controlWrap.insertBefore(subControls, controlWrap.firstChild);
					} else {
						controlWrap.append(subControls);
					}
				} else {
					if (subControlsLocation[1] === 'before') {
						controlField.insertBefore(subControls, controlField.firstChild);
					} else {
						controlField.append(subControls);
					}
				}
			}

			form.append(controlWrap);
			controls[attr] = controlField;
			attrsFlat.push(attr);
			// this.elData(form).controls[attr] = controlField;
		}

		this.activeNodes[nodeData.uniqueRef] = {
			nodeElement: nodeData.element,
			nodeData,
			controls,
			conditions: conditionalControls,
		};

		// Adjust dynamic matrix fields
		const dynamicMatrixControls = form.querySelectorAll('[data-matrix-size-from]');
		for (let matrixControl of dynamicMatrixControls) {
			const matrixSizeFromAttr = matrixControl.getAttribute('data-matrix-size-from');
			const matrixSizeFrom = controls[matrixSizeFromAttr].querySelector(`[name="${matrixSizeFromAttr}"]`);
			const matrixSize = this.getCompoundValue(matrixSizeFrom.id, form);
			const linkedGridId = matrixControl.getAttribute('data-matrix-from');
			const linkedGrid = form.querySelector(`#${linkedGridId}`);
			const defaultMatrix = this.getMatrixValue(linkedGrid);

			// In case one control affects more than one field, ensure the IDs are listed instead of replaced
			if (matrixSizeFrom.hasAttribute('data-matrix-size-control')) {
				const currGridList = matrixSizeFrom.getAttribute('data-matrix-size-control').split(',');
				matrixSizeFrom.setAttribute('data-matrix-size-control', [linkedGridId].concat(currGridList));
			} else {
				matrixSizeFrom.setAttribute('data-matrix-size-control', linkedGridId);
			}

			const updatedMatrix = this.buildMatrix(matrixSize, defaultMatrix, linkedGrid);
			triggerChange(updatedMatrix.querySelector('[data-matrix-input-cell]'));
		}

		// Adjust conditional fields
		const formConditionalControls = Array.from(form.querySelectorAll('[data-control-conditions]'));
		for (let conditionalControl of formConditionalControls) {
			const conditionParsed = JSON.parse(conditionalControl.getAttribute('data-control-conditions'));
			const nodeControlState = this.getControlConditionalState(conditionalControl, conditionParsed);
			this.toggleConditionalControl(conditionalControl, nodeControlState);
		}

		return form;
	}

	buildAttrControl({ attrs, nodeType, attr, attrConfig, form, controlWrap, controlField, isSubControl }) {
		const node = this.elData(form).node;
		const attrData = attrConfig.attrType;
		const attrDefault = attrConfig.default;
		const attrComputed = attrConfig.computed || false;
		const attrConditions = attrConfig.conditions || null;
		const controlGuid = generateId('control');
		const valueType = Array.isArray(attrData.value) ? '<custom:select>' : attrData.value;
		let controlInput;
		let globalType;
		let subControls;
		let subControlsLocation;
		let defaultValue;
		let autoWrap = false;

		switch (valueType) {
			case '<string>':
			case '<iri>':
			case fePrimRef: {
				globalType = 'string';
				if (attrComputed) {
					controlInput = el('output', { innerText: '' });
				} else {
					controlInput = el('input', { type: 'text', name: attr, draggable: true });

					if (valueType === fePrimRef) {
						const uniqueRefName = generateId(nodeType, true);
						controlInput.setAttribute('data-primitive-ref', uniqueRefName);
						controlInput.value = uniqueRefName;
						this.elData(controlInput).primitiveRef = true; // Boolean because the value will be pulled from the input, no need to make it more complicated
						// controlInput.pattern = `[A-Za-z0-9]+`;
						controlInput.required = true;
					} else if (valueType === '<iri>') {
						// TODO Make that dang URL pattern work on a type=text field
						// ! type=url works only for absolute URLs, not ./relative or #anchor links
						// controlInput.pattern = `^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?`;
						controlInput.required = true;
					}
				}
				break;
			}
			case '<primitive-reference-list>': {
				globalType = 'string';
				controlInput = el('input', { type: 'text', name: attr, draggable: true, readOnly: true });
				subControls = el('div', { className: 'control-options' });
				subControlsLocation = ['outer', 'after'];

				const allowedSubNodes = this.nodes.filter((node) => node.nested && node.nested.includes(nodeType));
				allowedSubNodes.forEach((subNode) => {
					const subNodeEl = el('button', { type: 'button', innerText: `+${subNode.label}` });
					subNodeEl.setAttribute('data-create-from-template', subNode.ref);
					subControls.append(subNodeEl);
				});
				break;
			}
			case '<number>':
			case '<number-positive>':
			case '<integer>':
			case '<alpha-value>': {
				globalType = 'number';
				if (attrComputed) {
					controlInput = el('output', { innerText: '0' });
				} else {
					controlInput = el('input', { type: 'number', name: attr, draggable: true });

					// Adjust number input attributes
					if (valueType === '<integer>') {
						controlInput.setAttribute('step', '1');
					} else if (valueType === '<number-positive>') {
						controlInput.setAttribute('min', '0');
					} else if (valueType === '<alpha-value>') {
						controlInput.setAttribute('min', '0');
						controlInput.setAttribute('max', '1');
						controlInput.setAttribute('step', '0.1');
					}

					// Assign hardcoded attributes
					if (attrConfig.min || attrConfig.min === 0) {
						controlInput.setAttribute('min', attrConfig.min);
					}
					if (attrConfig.max || attrConfig.max === 0) {
						controlInput.setAttribute('max', attrConfig.max);
					}
				}
				break;
			}
			case '<color>': {
				globalType = 'color';
				if (attrComputed) {
					controlInput = el('output', { innerText: '#ff0000' });
				} else {
					controlInput = el('input', { type: 'text', name: attr, draggable: true });
					controlInput.setAttribute('list', this.colorList.id);

					if (!attrData.placeholder) {
						attrData.placeholder = '#d00dad'; // :)
					}
				}
				break;
			}
			case '<identity-matrix>': {
				globalType = 'string';
				controlInput = el('textarea', { name: attr, draggable: true, hidden: true });
				subControls = this.buildMatrix(attrConfig.size || 0, attrConfig.default || null); // Create an empty matrix by default, it'll be generated after all fields have been added, or use the provided value
				subControlsLocation = ['inner', 'after'];
				controlInput.setAttribute('data-matrix-from', subControls.id);
				subControls.setAttribute('data-matrix-to', controlGuid);

				if (attrConfig.size) {
					subControls.setAttribute('data-matrix-fixed-size', attrConfig.size);
				}

				if (attrConfig.sizeFrom) {
					controlInput.setAttribute('data-matrix-size-from', attrConfig.sizeFrom);
				}
				break;
			}
			case '<number-list>': {
				globalType = 'string';
				controlInput = el('input', { type: 'text', name: attr, draggable: true, pattern: '[0-9\\s]+' });
				break;
			}
			case '<custom:select>': {
				globalType = 'string';
				controlInput = el('select', { name: attr, draggable: true });

				for (let valIndex = 0; valIndex < attrData.value.length; valIndex++) {
					const optValue = attrData.value[valIndex];
					const optLabel = attrData.labels && attrData.labels[valIndex] !== undefined ? attrData.labels[valIndex] : optValue;
					const opt = el('option', { value: optValue, innerText: optLabel });

					// Setup unusable option
					if (optValue === fePrimRef) {
						opt.setAttribute('data-dynamic-option-ref', optValue);
						opt.hidden = true;
					}
					controlInput.append(opt);
				}
				break;
			}
			case '<number-optional-number>':
			case '<custom:compound-value>': {
				globalType = 'string';
				controlInput = el('input', { name: attr, draggable: true, type: 'hidden' });
				subControls = el('div', { className: 'compound-input' });
				subControlsLocation = ['inner', 'after'];
				let subControlIdList = [];
				let controlDefault = attrConfig.default || [];

				for (let subAttr in attrData.subAttrs) {
					const parentControlDefaultItemIndex = Object.keys(attrData.subAttrs).indexOf(subAttr);
					const subAttrData = attrData.subAttrs[subAttr];
					const parentHasDefault = attrConfig.default && attrConfig.default.hasOwnProperty(parentControlDefaultItemIndex);
					if (parentHasDefault) {
						subAttrData.default = attrConfig.default[parentControlDefaultItemIndex];
					}
					const subAttrControl = this.buildAttrControl({
						nodeType,
						attr: subAttr,
						attrConfig: subAttrData,
						form,
						controlWrap: null,
						parentControl: controlWrap,
						isSubControl: true,
					});
					const subAttrInput = subAttrControl.controlInput;
					const subAttrAppendable = subAttrControl.appendableElement;

					subAttrInput.setAttribute('aria-label', subAttr);
					subAttrInput.setAttribute('data-compound-part-for', controlGuid);

					subControls.append(subAttrAppendable);
					subControlIdList.push(subAttrControl.controlGuid);
					if (!parentHasDefault && (subAttrData.default || subAttrData.default === 0)) {
						controlDefault.push(subAttrData.default);
					}
				}

				// Provide the list of inputs that build this value
				controlInput.setAttribute('data-compound-from', subControlIdList.join(','));

				if (!attrData.default && attrData.default !== 0) {
					attrData.default = controlDefault.flat(Infinity).join(' ').trim();
				}

				break;
			}
		}

		controlInput.id = controlGuid;
		Object.assign(this.elData(controlInput), { form, node, attrConfig, controlWrap });

		if (attrComputed) {
			controlInput.setAttribute('data-computed', 'true');
		}

		if (valueType === '<primitive-reference-list>') {
			this.setInputValueFromControls(controlInput, 0);
		}

		if (attrData.placeholder) {
			controlInput.placeholder = `e.g: ${attrData.placeholder}`;
		}

		if (attrDefault || attrDefault === 0 || attrData.default || attrData.default === 0) {
			defaultValue = attrDefault !== undefined ? attrDefault : attrData.default !== undefined ? attrData.default : '';

			// Ensure arrays are stringified
			if (Array.isArray(defaultValue)) {
				defaultValue = defaultValue.filter(Boolean).flat(Infinity).join(' ');
			}

			controlInput.value = String(defaultValue).trim();

			if (globalType === 'number') {
				// If there is no default, simply use zero for number inputs
				if (!defaultValue) {
					defaultValue = '0';
					controlInput.value = defaultValue;
				}

				// If there is a default value that is between 0 and 1, use it as the step, if not provided already
				if (parseFloat(controlInput.value) > 0 && parseFloat(controlInput.value) < 1 && !controlInput.step) {
					controlInput.step = controlInput.value;
				}
			}
		}

		let appendableElement = controlInput;
		if (isSubControl && subControls) {
			appendableElement = el('div');
			appendableElement.append(controlInput, subControls);
		}

		if (attrConditions && isSubControl) {
			appendableElement.setAttribute('data-control-conditions', JSON.stringify(attrConditions));
		}

		return {
			appendableElement,
			controlInput,
			controlGuid,
			valueType,
			globalType,
			subControls,
			subControlsLocation: subControls ? subControlsLocation || ['inner', 'after'] : false,
		};
	}

	buildMatrix(size, fill = null, target = null) {
		if (!Array.isArray(size)) {
			size = String(size)
				.trim()
				.split(/[ ,x]+/)
				.map((c) => c.trim())
				.filter(Boolean); // Convert `x{SEP}y` into `[x,y]`
			if (size.length === 1) {
				size = [size[0], size[0]]; // If Y is missing, copy the value of X
			}
		}

		const [sizeX, sizeY] = size;

		let grid;
		if (target) {
			grid = target.matches('.input-matrix-grid') ? target : target.querySelector('.input-matrix-grid');
			emptyEl(grid);
		} else {
			grid = el('fieldset', { className: 'input-matrix-grid', id: generateId('matrix-grid', true) });
		}
		grid.append(el('legend', { className: 'visually-hidden', innerText: `Value matrix grid, ${sizeX} by ${sizeY}` }));
		grid.style.setProperty('--matrix-grid-x', sizeX);
		grid.style.setProperty('--matrix-grid-y', sizeY);
		grid.setAttribute('data-matrix-grid-x', sizeX);
		grid.setAttribute('data-matrix-grid-y', sizeY);

		for (let y = 0; y < sizeY; y++) {
			for (let x = 0; x < sizeX; x++) {
				const cellInput = el('input', { type: 'number', draggable: true, step: 0.1, placeholder: '0', ariaLabel: `Matrix value at X=${x + 1} and Y=${y + 1}` });

				if (fill && fill.hasOwnProperty(y) && fill[y].hasOwnProperty(x)) {
					cellInput.value = fill[y][x];
				}
				cellInput.setAttribute('data-matrix-input-cell', '');
				cellInput.setAttribute('data-matrix-input-x', x + 1);
				cellInput.setAttribute('data-matrix-input-y', y + 1);
				grid.append(cellInput);
			}
		}

		return grid;
	}

	createUnitController(controlParts, unitsData) {
		const { controlField, label, input, form } = controlParts;
		const fieldsetName = `${input.name}-unit`;
		const fieldsetEl = el('fieldset', { id: generateId('unit'), className: 'app-node-tile__control-label-unit-control' });
		const units = unitsData.options;

		for (let unit of units) {
			const unitId = generateId('unit');
			let unitLabel;
			switch (unit) {
				case '%': {
					unitLabel = 'percent';
					break;
				}
				case '':
				default: {
					unitLabel = 'unitless';
					break;
				}
			}
			const unitLabelEl = el('label', { htmlFor: unitId, className: 'app-node-tile__control-label-unit-item' });
			const unitTextEl = el('span', { innerText: unitLabel });
			const unitRadioEl = el('input', { type: 'radio', id: unitId, name: fieldsetName, value: unit, checked: unit === '' });
			unitRadioEl.setAttribute('data-unit-control', unit);
			unitLabelEl.append(unitRadioEl, unitTextEl);
			fieldsetEl.append(unitLabelEl);
			input.setAttribute('data-unit-from', fieldsetEl.id);
			fieldsetEl.setAttribute('data-unit-name', fieldsetName);
		}

		label.append(fieldsetEl);
		input.setAttribute('data-unit-control', fieldsetEl.id);
	}

	addFlowPorts(controlWrap, controlInputId, direction = 'out', portConfig = {}) {
		if (['in', 'out'].includes(direction) !== true) {
			return;
		}

		let typeName = portConfig.type || 'string';
		let flowRelation = portConfig.relation || (direction === 'in' ? 'one' : 'many'); // Many-to-one by default (output can be used many times, input can only receive one value)

		let portType;
		switch (typeName) {
			case 'number': {
				portType = 'number';
				break;
			}
			case 'color': {
				portType = 'color';
				break;
			}
			default: {
				portType = 'string';
			}
		}

		let port = el('div', { className: 'app-node-tile__port', draggable: true });
		port.setAttribute('data-port-direction', direction);
		port.setAttribute('data-port-type', portType);
		port.setAttribute('data-port-link', controlInputId);
		port.setAttribute('data-port-relation', flowRelation);
		controlWrap.append(port);
	}

	getNodeFormData(node) {
		const form = node.querySelector('.app-node-tile__form');
		if (!form) {
			return null;
		}
		return getFormData(form);
	}

	getControlConditionalState(conditionalElement, controlConditions) {
		const hasControlConditions = conditionalElement.closest('[data-control-conditions]');
		if (!hasControlConditions) {
			return true;
		}

		const nodeObj = this.getNodeFromElement(conditionalElement);
		const nodeControls = nodeObj.controls;
		const isControlEnabled = controlConditions.some((cond) => this.getOutputValue(nodeControls[cond.attr]) === cond.value);

		return isControlEnabled;
	}

	toggleConditionalControl(control, isVisible) {
		control.closest('[data-control-conditions]').hidden = !isVisible;
	}

	/** Adjust the position of a Node Tile */
	repositionNodeTile(node, x, y) {
		const nodeTileData = this.getNodeFromElement(node); // Grab the node's current data

		// Ensure the tile isn't hidden in negative coordinates
		x = Math.max(0, x);
		y = Math.max(0, y);

		// Update the node's position data and styles
		this.elData(node).position = { x, y };
		nodeTileData.position = { x, y };
		node.style.left = `${x}px`;
		node.style.top = `${y}px`;
	}

	/** Remove a Node Tile and disconnect it from any linked tiles. */
	destroyNodeTile(node, confirm = false) {
		const nodeRef = node.id;
		const nodeObj = this.getNodeFromElement(node);
		const linkedPorts = Array.from(node.querySelectorAll('[data-port-connected="true"]'));

		if (!confirm || window.confirm(`This will delete the ${nodeObj.nodeData.label} node. Are you sure?`)) {
			linkedPorts.forEach((port) => {
				this.unlinkPort(port);
			});

			if (this.activeNodes[nodeRef]) {
				delete this.activeNodes[nodeRef];
			}
			node.remove();
		}
	}

	getInputControlFromList(inputControl) {
		return (inputControl.getAttribute('data-from-control') || '')
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
	}

	setInputControlFromList(inputControl, newList) {
		newList = newList.map((c) => c.trim()).filter(Boolean);
		if (newList.length === 0) {
			inputControl.removeAttribute('data-from-control');
		} else {
			inputControl.setAttribute('data-from-control', newList.join(','));
		}
		return newList;
	}

	setInputValueFromControls(inputControl, count) {
		const word = this.elData(inputControl).attrConfig.word || 'node';
		const plural = this.elData(inputControl).attrConfig.plural || `${word}s`;

		inputControl.value = `(${count} ${count !== 1 ? plural : word})`;
	}

	/** Links two ports together */
	linkPorts(portA, portB) {
		if (portA.getAttribute('data-port-direction') === portB.getAttribute('data-port-direction')) {
			return; // Two inputs or two outputs cannot be linked
		}

		const outputPort = [portA, portB].find((p) => p.getAttribute('data-port-direction') === 'out');
		const outputControl = document.getElementById(outputPort.getAttribute('data-port-link'));
		const outputValue = this.getOutputValue(outputControl);
		const isOutputPortMany = outputPort.getAttribute('data-port-relation') === 'many';

		const inputPort = [portA, portB].find((p) => p.getAttribute('data-port-direction') === 'in');
		const inputControl = document.getElementById(inputPort.getAttribute('data-port-link'));
		const inputSelectOptions = inputControl.options ? Array.from(inputControl.options) : null;
		const isInputPortMany = inputPort.getAttribute('data-port-relation') === 'many';

		if (inputSelectOptions && inputSelectOptions.map((opt) => opt.value).includes(outputControl.getAttribute('data-control-type'))) {
			// For dynamic options, update the value
			const dynamicOptionIndex = inputSelectOptions.findIndex((opt) => opt.value === outputControl.getAttribute('data-control-type'));
			const dynamicOption = inputSelectOptions[dynamicOptionIndex];
			dynamicOption.hidden = false;
			dynamicOption.setAttribute('data-dynamic-option-ref', outputControl.id);
			dynamicOption.innerText = outputValue;
			inputControl.disabled = true;
		} else if (outputControl.getAttribute('data-port-type') !== inputControl.getAttribute('data-port-type')) {
			// Don't allow mismatched types: color and number cannot be mixed
			return;
		}

		outputPort.setAttribute('data-port-connected', 'true');

		inputPort.setAttribute('data-port-connected', 'true');
		inputControl.readOnly = true;

		// If the output can only link to one node, unlink previous connection
		if (!isOutputPortMany) {
			this.unlinkPort(outputPort);
		}

		// If the input can accept more than one value, compound into a list
		const fromControlAttr = this.getInputControlFromList(inputControl);
		if (isInputPortMany && fromControlAttr.length > 0) {
			let newList = ArrayUnique([outputControl.id].concat(fromControlAttr));
			inputControl.setAttribute('data-from-control', newList.join(','));
		} else {
			inputControl.setAttribute('data-from-control', outputControl.id);
		}

		if (inputControl.closest('.custom-input')) {
			inputControl.closest('.custom-input').classList.add('custom-input--has-readonly');
			Array.from(inputControl.closest('.custom-input').querySelectorAll('[data-input-binding]')).forEach((input) => {
				if (input.type === 'color') {
					input.disabled = true;
				}
				input.readOnly = true;
			});
		}

		this.updateLinkedControls(inputControl);
	}

	/** Unlinks a port */
	unlinkPort(port, controlToUnlink = null) {
		if (!port) {
			console.warn('Cannot unlink port: no port referenced!');
			return;
		}

		const portDirection = port.getAttribute('data-port-direction');
		const portRelation = port.getAttribute('data-port-relation');

		if (!portDirection || !portRelation) {
			console.warn('Cannot unlink port: port direction and/or relation missing!');
			return;
		}

		const control = document.getElementById(port.getAttribute('data-port-link'));

		// IF dir == in AND rel == many
		// IF dir == out AND rel == one
		// THEN unlink

		// IF dir == in AND rel == one
		// IF dir == out AND rel == many
		// THEN

		if (portDirection === 'in') {
			const originalControlIdList = this.getInputControlFromList(control);

			// Unlink dynamic select option
			if (control.matches('select') && control.querySelector(`option[value="${fePrimRef}"]`)) {
				const dynamicOption = control.querySelector(`option[value="${fePrimRef}"]`);
				dynamicOption.hidden = true;
				dynamicOption.removeAttribute('data-dynamic-option-ref');
				dynamicOption.innerText = fePrimRef;
				control.options[0].selected = true;
			}

			let controlFromList;
			if (controlToUnlink && originalControlIdList.includes(controlToUnlink)) {
				const newList = originalControlIdList.filter((controlId) => controlId !== controlToUnlink);
				controlFromList = this.setInputControlFromList(control, newList);

				if (control.matches('input')) {
					this.setInputValueFromControls(control, controlFromList.length);
				}
			} else {
				controlFromList = '';
			}

			// If the control from value is empty, revert the control
			if (controlFromList.length === 0) {
				port.removeAttribute('data-port-connected');
				control.disabled = false; // For selects
				control.readOnly = false; // For all other types
				control.removeAttribute('data-from-control');

				if (control.closest('.custom-input')) {
					control.closest('.custom-input').classList.remove('custom-input--has-readonly');
					Array.from(control.closest('.custom-input').querySelectorAll('[data-input-binding]')).forEach((input) => {
						if (input.type === 'color') {
							input.disabled = false;
						}
						input.readOnly = false;
					});
				}
			}

			// If the output port providing the value has no other links, revert its state to disconnected
			if (originalControlIdList.length > 0) {
				for (let originalControlId of originalControlIdList) {
					const originalControlHasOtherLinks = Boolean(this.app.querySelector(`[data-from-control*="${originalControlId}"]`));
					if (!originalControlHasOtherLinks) {
						const originalControlPort = this.app.querySelector(`[data-port-link="${originalControlId}"]`);
						originalControlPort.removeAttribute('data-port-connected');
					}
				}
			}
		} else if (portDirection === 'out') {
			// Find all ports for this output and unlink them
			const linkedInputs = Array.from(this.app.querySelectorAll(`[data-from-control*="${control.id}"]`));
			linkedInputs.forEach((linkedInput) => {
				const linkedPort = this.app.querySelector(`[data-port-link="${linkedInput.id}"]`);
				this.unlinkPort(linkedPort, control.id);
			});
		}
	}

	updateLinkedControls(targetInput = null) {
		if (targetInput) {
			if (!Array.isArray(targetInput)) {
				targetInput = [targetInput];
			}
		}

		const linkedInputs = targetInput || Array.from(this.app.querySelectorAll('[data-from-control]'));
		linkedInputs.forEach((input) => {
			const linkId = input.getAttribute('data-from-control');
			const link = document.getElementById(linkId);
			const linkValue = this.getOutputValue(link);
			if (input.tagName.toLowerCase() === 'select' && link.getAttribute('data-control-type') === fePrimRef) {
				input.value = link.getAttribute('data-control-type');
			} else {
				input.value = linkValue;
			}

			triggerChange(input);
		});
	}

	/** Render lines between ports */
	drawPortLinks() {
		// Empty the drawn links first so we can redraw them from scratch (perf issue?)
		emptyEl(this.graphLines);

		// Recalculate size
		const graphWidth = this.graph.clientWidth;
		const graphHeight = this.graph.clientHeight;
		const strokeWidth = 4;
		this.graphLines.setAttributeNS(svgNS, 'viewBox', `0 0 ${graphWidth} ${graphHeight}`);
		this.graphLines.style.setProperty('--strokeWidth', strokeWidth);

		const ports = Array.from(this.app.querySelectorAll('[data-port-link][data-port-direction="in"]'));
		ports.forEach((port) => {
			const inputId = port.getAttribute('data-port-link');
			const input = document.getElementById(inputId);
			const outputIdList = this.getInputControlFromList(input);

			// Don't draw any unlinked port, or any hidden controls
			if (outputIdList.length === 0 || input.closest('[hidden]')) {
				return;
			}

			for (let outputId of outputIdList) {
				const outputPort = this.app.querySelector(`[data-port-link="${outputId}"]`);
				const outputPortPos = getElementPosition(outputPort, this.graph);
				const outputPortCenter = { x: outputPort.clientWidth / 2, y: outputPort.clientHeight / 2 };
				const inputPortPos = getElementPosition(port, this.graph);
				const inputPortCenter = { x: port.clientWidth / 2, y: port.clientHeight / 2 };
				const graphOffset = getElementPosition(this.graph);
				const portType = outputPort.getAttribute('data-port-type');
				const linePoints = {
					x1: inputPortPos.x + strokeWidth / 2 + inputPortCenter.x - graphOffset.x,
					y1: inputPortPos.y + strokeWidth / 2 + inputPortCenter.y - graphOffset.y,
					x2: outputPortPos.x + strokeWidth / 2 + outputPortCenter.x - graphOffset.x,
					y2: outputPortPos.y + strokeWidth / 2 + outputPortCenter.y - graphOffset.y,
				};
				const buttonSize = 20;
				const pathCurveControlPointDistance = Math.min(Math.abs(linePoints.y2 - linePoints.y1), Math.abs(linePoints.x2 - linePoints.x1));

				const lineLink = el(
					'a',
					{
						href: '#',
						class: `app-graph-line-action`,
						'data-link-output': outputId,
						'data-link-input': inputId,
					},
					'svg'
				);

				const lineEl = el(
					'path',
					{
						// x1: linePoints.x1,
						// y1: linePoints.y1,
						// x2: linePoints.x2,
						// y2: linePoints.y2,
						d: `M ${linePoints.x1} ${linePoints.y1}
							C ${linePoints.x1 - pathCurveControlPointDistance} ${linePoints.y1},
							${linePoints.x2 + pathCurveControlPointDistance} ${linePoints.y2},
							${linePoints.x2} ${linePoints.y2}`,
						class: `app-graph-line app-graph-line--${portType}`,
					},
					'svg'
				);

				const lineButton = el(
					'rect',
					{
						width: buttonSize,
						height: buttonSize,
						x: (linePoints.x1 + linePoints.x2 - buttonSize) / 2,
						y: (linePoints.y1 + linePoints.y2 - buttonSize) / 2,
						rx: buttonSize / 2,
						ry: buttonSize / 2,
						class: 'app-graph-line-action-button',
					},
					'svg'
				);
				const lineDiagNWSE = el(
					'line',
					{
						width: buttonSize / 2,
						height: buttonSize / 2,
						x1: (linePoints.x1 + linePoints.x2) / 2 - buttonSize / 5,
						x2: (linePoints.x1 + linePoints.x2) / 2 + buttonSize / 5,
						y1: (linePoints.y1 + linePoints.y2) / 2 - buttonSize / 5,
						y2: (linePoints.y1 + linePoints.y2) / 2 + buttonSize / 5,
						class: 'app-graph-line-action-button-line',
					},
					'svg'
				);
				const lineDiagNESW = el(
					'line',
					{
						width: buttonSize / 2,
						height: buttonSize / 2,
						x1: (linePoints.x1 + linePoints.x2) / 2 + buttonSize / 5,
						x2: (linePoints.x1 + linePoints.x2) / 2 - buttonSize / 5,
						y1: (linePoints.y1 + linePoints.y2) / 2 - buttonSize / 5,
						y2: (linePoints.y1 + linePoints.y2) / 2 + buttonSize / 5,
						class: 'app-graph-line-action-button-line',
					},
					'svg'
				);
				lineLink.append(lineEl, lineButton, lineDiagNWSE, lineDiagNESW);

				this.graphLines.append(lineLink);
			}
		});
	}

	extendGraphArea() {
		const additionalSpace = 200; // How much "bleed" area to add, in px
		let target = this.graph.querySelector('.app-graph-extender');
		if (!target) {
			target = el('div', { className: 'app-graph-extender', draggable: false, ariaHidden: true });
			this.graph.append(target);
		}
		let maxX = 0;
		let maxY = 0;
		const nodes = Array.from(this.graph.querySelectorAll('.app-node-tile'));
		nodes.forEach((node) => {
			const nodePos = getElementPosition(node, this.graph);
			const nodeEndX = nodePos.x + node.clientWidth;
			const nodeEndY = nodePos.y + node.clientHeight;
			maxX = Math.max(maxX, nodeEndX);
			maxY = Math.max(maxY, nodeEndY);
		});
		target.style.left = `${maxX + additionalSpace}px`;
		target.style.top = `${maxY + additionalSpace}px`;
	}

	getPreviewType() {
		const formData = getFormData(this.previewForm);
		const type = formData['filter-preview-type'];
		return type;
	}

	getNodeFromElement(element) {
		const nodeTile = element.closest('.app-node-tile');
		const nodeRef = nodeTile.id;
		return this.activeNodes[nodeRef];
	}

	getOutputValue(control, getDynamicValue = false) {
		if (!control) {
			return null;
		}

		// If the control was passed as the containing element, find the actual field
		if (!control.matches(`[name]`) && control.querySelector(`[name]`)) {
			control = control.querySelector(`[name]`);
		}

		const controlTag = control.tagName.toLowerCase();
		let value = controlTag === 'output' ? control.innerText : control.value;

		// If the output is data-dynamic-option-ref, use that instead
		if (getDynamicValue) {
			if (controlTag === 'select') {
				if (Array.from(control.selectedOptions).find((opt) => opt.matches('[data-dynamic-option-ref]'))) {
					const dynamicOptionRefId = control.querySelector('[data-dynamic-option-ref]').getAttribute('data-dynamic-option-ref');
					if (getDynamicValue === 'refId') {
						return dynamicOptionRefId;
					}
					return this.getOutputValue(document.getElementById(dynamicOptionRefId)) || value;
				}
			}
		}

		if (value.trim().includes('\n')) {
			let valueLines = value.trim().split('\n');
			let valuesNested = valueLines.map((line) => line.split(' ').filter(Boolean));
			let valuesFlat = valuesNested.flat(Infinity);
			let valuesLength = valuesFlat.map((val) => val.length);
			let longestValue = Math.max.apply(null, valuesLength);
			let valuePadded = valuesNested.map((line) => line.map((val) => val.padEnd(longestValue, ' ')).join(' ')).join('\n');
			return valuePadded;
		}

		return value;
	}

	getCompoundValue(compoundReceiverId, form = null) {
		const compoundReceiver = form ? form.querySelector(`#${compoundReceiverId}`) : document.getElementById(compoundReceiverId);
		const compoundPartsIdList = compoundReceiver.getAttribute('data-compound-from').trim().split(',');
		const compoundValues = compoundPartsIdList.map((partId) => {
			const control = form ? form.querySelector(`#${partId}`) : document.getElementById(partId);

			// If the control is hidden and isn't itself a compound value, or if it's part of a conditional value that is hidden, ignore its value
			if ((control.closest('[hidden]') && !control.closest('[hidden]').matches('[data-compound-part-for]')) || control.closest('[hidden][data-control-conditions]')) {
				return null;
			}
			return this.getOutputValue(control);
		});
		return compoundValues.filter(Boolean).join(' ').trim();
	}

	getMatrixValue(matrixGrid) {
		// Ensure the containing grid is the provided element
		if (!matrixGrid.closest('.input-matrix-grid')) {
			matrixGrid = matrixGrid.querySelector('.input-matrix-grid');
		}

		const gridSizeX = parseInt(matrixGrid.getAttribute('data-matrix-grid-x'), 10);
		const gridSizeY = parseInt(matrixGrid.getAttribute('data-matrix-grid-y'), 10);
		let gridValues = Array.from({ length: gridSizeY }, (v, i) => Array.from({ length: gridSizeX }, (w, j) => i + '' + j));

		for (let x = 0; x < gridSizeX; x++) {
			for (let y = 0; y < gridSizeY; y++) {
				const cellInput = matrixGrid.querySelector(`input[data-matrix-input-x="${x + 1}"][data-matrix-input-y="${y + 1}"]`);
				const cellValue = cellInput.value || 0;
				gridValues[y][x] = cellValue;
			}
		}

		return gridValues;
	}

	nodeFromTemplate(template, position = null) {
		const data = { type: 'template', ref: template.getAttribute('data-node-ref') };

		// If position data is not provided, place the new node a bit after the last node
		if (!position) {
			const activeNodeValues = Object.keys(this.activeNodes).reverse();
			const offset = activeNodeValues.length > 0 ? 42 : 0;
			const lastNodePosition =
				activeNodeValues.length > 0 ? this.activeNodes[activeNodeValues[0]].position : { x: getElementPosition(this.sidebar).x + this.sidebar.clientWidth, y: 12 };

			position = {
				x: lastNodePosition.x + offset,
				y: lastNodePosition.y + offset,
			};
		}

		let nodeTile = this.addNodeTile({ ref: data.ref, x: position.x, y: position.y });
		this.graph.append(nodeTile);

		this.render();

		return nodeTile;
	}

	/** Handle registered events */
	handleEvent(e) {
		switch (e.type) {
			case 'focusout':
			case 'visibilitychange':
			case 'keyup': {
				this.graphLines.classList.remove('is-shifted');
				break;
			}

			case 'keydown': {
				if (e.shiftKey) {
					this.graphLines.classList.add('is-shifted');
				}
				break;
			}
		}

		// If the target was outside of the app, the event can be ignored
		if (e.target.contains(this.app)) {
			return;
		}

		let target;
		switch (e.type) {
			case 'dragstart': {
				// For any drag started on an input, bail
				if (e.target.closest(this.inputSelectorList) || e.target.closest('.app-node-tile__preview-button')) {
					e.preventDefault();
					e.stopPropagation(); // Prevents the parent from receiving the drag event
					return;
				}

				let targetType;
				let targetData = {};

				if ((target = e.target.closest('.app-preview-resizer'))) {
					targetType = 'resizer';
					targetData.info = { type: targetType, handle: target, startHeight: this.preview.clientHeight };
					targetData.effect = 'none';

					const img = new Image();
					img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // Transparent pixel
					e.dataTransfer.setDragImage(img, 1, 1);
				} else if ((target = e.target.closest('[data-port-type]'))) {
					// Connect two ports
					targetType = 'port';
					targetData.info = { type: targetType, node: target.closest('.app-node-tile').id, ref: target.getAttribute('data-port-link') };
					targetData.effect = 'copy';
				} else if ((target = e.target.closest('.app-template-tile'))) {
					// Clone a template
					targetType = 'node';
					targetData.effect = 'copy';
					targetData.info = { type: 'template', ref: target.getAttribute('data-node-ref') };
				} else if ((target = e.target.closest('.app-node-tile'))) {
					// Move an existing tile
					targetType = 'node';
					targetData.effect = 'move';
					targetData.info = { type: 'tile', ref: target.id };
				}

				// If the target is valid, calculate its "drag and drop" transfer data
				if (targetType === 'resizer') {
					const targetOffset = getClickOffset(e, target);
					targetData.info.position = { x: e.clientX, y: e.clientY };
					targetData.info.lastPosition = {};
					targetData.info.offset = targetOffset;
					target.classList.add('is-resizing');
					this.dataTransfer = targetData.info;
				} else if (target && ['node', 'port'].includes(targetType)) {
					const targetOffset = getClickOffset(e, target);
					target.classList.add('is-dragged');
					e.dataTransfer.effectAllowed = targetData.effect;
					e.dataTransfer.dropEffect = targetData.effect;
					targetData.info.position = { x: target.offsetLeft, y: target.offsetTop };
					targetData.info.lastPosition = {};
					targetData.info.offset = targetOffset;
					this.dataTransfer = targetData.info;

					if (targetType === 'node') {
						// Hide the real tile if dragging an existing one: if a drag is cancelled, the tile won't pop in and out of existence
						if (targetData.effect === 'move') {
							requestAnimationFrame(() => (target.style.opacity = 0));
						}
					} else if (targetType === 'port') {
						target.classList.add('is-attempt');
					}
				} else {
					e.preventDefault();
					return;
				}

				if (targetData.effect) {
					e.dataTransfer.dropEffect = targetData.effect;
				}

				break;
			}

			case 'dragend': {
				let targetType;
				if ((target = e.target.closest('.app-preview-resizer'))) {
					targetType = 'resizer';
					e.dataTransfer.dropEffect = 'none';
				} else if (e.target.closest('.app-node-tile__preview-button')) {
					target = null;
					targetType = null;
				} else if ((target = e.target.closest('[data-port-type]'))) {
					targetType = 'port';
					e.dataTransfer.dropEffect = 'copy';
				} else if ((target = e.target.closest('.app-template-tile'))) {
					targetType = 'node';
					e.dataTransfer.dropEffect = 'copy';
				} else if ((target = e.target.closest('.app-node-tile'))) {
					targetType = 'node';
					this.graph.append(target); // Move it back to the top of the stack
					e.dataTransfer.dropEffect = 'move';
				}

				if (target) {
					target.classList.remove('is-dragged');

					if (targetType === 'node') {
						target.style.opacity = '';
					}

					if (targetType === 'resizer') {
						target.classList.remove('is-resizing');
					}
				}

				const data = this.dataTransfer;
				const offset = data.offset;
				const originalPosition = data.position;
				const lastPos = data.lastPosition || { x: e.clientX, y: e.clientY };

				if (targetType === 'resizer') {
					// Logic is handled in the dragover/dragenter event
				} else if (targetType === 'node') {
					let nodeTile = target;

					if (this.dropTarget) {
						e.preventDefault();

						const dropzoneType = this.dropTarget.getAttribute('data-dropzone');
						if (dropzoneType === 'delete') {
							if (data.type === 'tile') {
								this.destroyNodeTile(target);
							}
						} else if (dropzoneType === 'nodes') {
							e.preventDefault();

							if (data.type === 'template') {
								nodeTile = this.addNodeTile({
									ref: data.ref,
									x: lastPos.x - offset.x + this.dropTarget.scrollLeft,
									y: lastPos.y - offset.y + this.dropTarget.scrollTop,
								});
								this.graph.append(nodeTile);
							} else if (data.type === 'tile') {
								nodeTile = target;
								this.repositionNodeTile(nodeTile, lastPos.x - offset.x, lastPos.y - offset.y);
							}
						}
					} else {
						// If the drag was cancel (esc key, etc), return the node to its original position
						if (nodeTile && data.type === 'tile') {
							this.repositionNodeTile(nodeTile, originalPosition.x, originalPosition.y);
						}
					}
				} else if (targetType === 'port') {
					const nodePort = target;
					const nodePortRelation = nodePort.getAttribute('data-port-relation');

					if (this.dropTarget) {
						if (this.dropTarget.matches('[data-dropzone]')) {
							// Delete the port connection if the nodePort is a one-to-* relation type
							if (target.matches('[data-port-relation="one"]')) {
								this.unlinkPort(nodePort);
							}
						} else if (this.dropTarget.matches('[data-port-direction]') && this.dropTarget !== nodePort) {
							if (nodePort.getAttribute('data-port-direction') === 'in' && this.dropTarget.getAttribute('data-port-direction') === 'in') {
								// If the ports have same flow direction, change the connection from one to the other
								const nodePortControlId = nodePort.getAttribute('data-port-link');
								const nodePortControl = document.getElementById(nodePortControlId);
								const originalControlId = nodePortControl.getAttribute('data-from-control');
								const originalControl = this.app.querySelector(`[data-port-link="${originalControlId}"][data-port-direction="out"]`);

								const targetPortRelation = this.dropTarget.getAttribute('data-port-relation');

								// TODO Check if, e.g. two feFuncR are added to the same feComponentTransfer
								console.log({ nodePortRelation, targetPortRelation });

								if (this.dropTarget.closest('.app-node-tile') === originalControl.closest('.app-node-tile')) {
									this.showMessage({ type: 'SELFREF' });
								} else {
									this.unlinkPort(nodePort);
									this.linkPorts(originalControl, this.dropTarget);
								}
							} else {
								if (this.dropTarget.closest('.app-node-tile') === nodePort.closest('.app-node-tile')) {
									this.showMessage({ type: 'SELFREF' });
								} else {
									// Connect two ports if they are different and from different parent elements
									this.linkPorts(nodePort, this.dropTarget);
								}
							}
							this.dropTarget.classList.remove('is-attempt');
						}
					}
					nodePort.classList.remove('is-attempt');
				}

				this.dropTarget = false;
				this.dataTransfer = null;
				this.render();

				break;
			}

			case 'dragenter':
			case 'dragover': {
				if (typeof e.target.closest !== 'function') {
					return;
				}

				this.dataTransfer = Object.assign({}, this.dataTransfer, { lastPosition: { x: e.clientX, y: e.clientY } });
				const data = this.dataTransfer;

				if (data && data && data.type === 'resizer') {
					const targetHeight = document.body.clientHeight - e.clientY;
					this.preview.style.height = `${targetHeight}px`;
					e.preventDefault();
					return;
				}

				if ((target = e.target.closest('.app-node-tile__port'))) {
					e.preventDefault();

					if (data.type === 'port') {
						target.classList.add('is-attempt');
					}
				} else if ((target = e.target.closest('[data-dropzone]'))) {
					e.preventDefault();
					const offset = data.offset;

					if (data.type === 'tile') {
						const nodeTile = document.getElementById(data.ref);
						this.repositionNodeTile(nodeTile, e.clientX - offset.x, e.clientY - offset.y);
						target.classList.toggle('is-threatening', target.matches('[data-dropzone="delete"]'));
					} else if (data.type === 'template') {
						target.classList.toggle('is-considering', target.matches('[data-dropzone="nodes"]'));
					}
				}

				break;
			}

			case 'dragleave': {
				if (!e.target || typeof e.target.closest !== 'function') {
					return;
				}

				this.dataTransfer = Object.assign({}, this.dataTransfer, { lastPosition: { x: e.clientX, y: e.clientY } });
				const data = this.dataTransfer;

				if (data && data.info && data.info.type === 'resizer') {
					e.preventDefault();
					return;
				}

				if ((target = e.target.closest('.app-node-tile__port'))) {
					e.preventDefault();
					if (data.type === 'port') {
						// Remove the attempt highlight if it is not the dragged port
						if (target.getAttribute('data-port-link') !== data.ref) {
							target.classList.remove('is-attempt');
						}
					}
				} else if ((target = e.target.closest('[data-dropzone]'))) {
					e.preventDefault();
					const offset = data.offset;

					if (data.type === 'tile') {
						const nodeTile = document.getElementById(data.ref);
						this.repositionNodeTile(nodeTile, e.clientX - offset.x, e.clientY - offset.y);
						target.classList.remove('is-threatening');
					}
					if (data.type === 'template') {
						target.classList.remove('is-considering');
					}
				}

				break;
			}

			case 'drag': {
				this.dataTransfer = Object.assign({}, this.dataTransfer, { lastPosition: { x: e.clientX, y: e.clientY } });

				if ((target = e.target.closest('[data-dropzone]'))) {
					this.drawPortLinks();
				}
				break;
			}

			case 'drop': {
				const isDroppedOnInput = !!e.target.closest(this.inputSelectorList);
				if ((target = e.target.closest('[data-port-direction]'))) {
					this.dropTarget = target;
				} else if ((target = e.target.closest('.app-node-tile__control'))) {
					this.dropTarget = target.querySelector('[data-port-direction]');
				} else if (!isDroppedOnInput && (target = e.target.closest('[data-dropzone]'))) {
					target.classList.remove('is-threatening');
					target.classList.remove('is-considering');
					this.dropTarget = target;
				} else {
					this.dropTarget = false;
				}

				break;
			}

			case 'focusin': {
				if ((target = e.target.closest('textarea'))) {
					if (target !== this.previewCode) {
						return;
					}

					target.select();
					document.execCommand('copy');
				}

				break;
			}

			case 'change': {
				// Handle the different cases
				if ((target = e.target.closest('.app-node-tile__form'))) {
					const formData = getFormData(target);

					if (formData['_node-type'] === 'mathsArithmetic') {
						const output = target.querySelector('[data-computed]');
						const numA = parseFloat(formData.numberA) || 0;
						const numB = parseFloat(formData.numberB) || 0;
						const operator = formData.operation;
						let result;

						if (operator === '/' && numB == 0) {
							result = 0;
						} else {
							switch (operator) {
								case '+': {
									result = numA + numB;
									break;
								}
								case '-': {
									result = numA - numB;
									break;
								}
								case '*': {
									result = numA * numB;
									break;
								}
								case '/': {
									result = numA / numB;
									break;
								}
							}
						}
						output.innerText = result;
						output.setAttribute('data-computed', result);
					} else if (formData['_node-type'] === 'mathsClamp') {
						const output = target.querySelector('[data-computed]');
						const num = parseFloat(formData.number) || 0;
						let min = parseFloat(formData.min) || -Infinity;
						let max = parseFloat(formData.max) || Infinity;

						const result = MathClamp(min, num, max);

						output.innerText = result;
						output.setAttribute('data-computed', result);
					} else if (formData['_node-type'] === 'inputRandom') {
						const output = target.querySelector('[data-computed]');
						let randMin = parseFloat(formData.min) || 0;
						let randMax = parseFloat(formData.max) || 0;
						if (randMin > randMax) {
							[randMax, randMin] = [randMin, randMax]; // Swap the numbers if the min is greater than the max
						}
						const precision = parseInt(formData.precision, 10) || 0;
						const exp = Math.pow(10, precision);
						let result = Math.floor((Math.random() * (randMax - randMin) + randMin) * exp) / exp;

						if (randMin === randMax) {
							result = randMax;
						}

						output.innerText = result.toFixed(precision);
						output.setAttribute('data-computed', result);
					} else if (formData['_node-type'] === 'inputColor' || e.target.closest('[data-custom-input-type="color"]')) {
						const changedColorInput = e.target.closest('[data-input-binding]');
						if (!changedColorInput) {
							return;
						}
						const boundColorInput = document.getElementById(changedColorInput.getAttribute('data-input-binding'));
						const colorInputs = [boundColorInput, changedColorInput];
						const customInput = boundColorInput.closest('.custom-input');
						const colorWrap = customInput.querySelector('.custom-input-colorwrap');
						const colorPickerInput = colorInputs.find((input) => input.matches('[data-color-input-pair-item="picker"]'));
						const colorTextInput = colorInputs.find((input) => input.matches('[data-color-input-pair-item="text"]'));
						colorWrap.removeAttribute('data-invalid-color');

						// Replace named color with hexidecimal value
						const matchingNamedColor = namedColorToHex(changedColorInput.value);
						if (changedColorInput.value && matchingNamedColor) {
							changedColorInput.value = matchingNamedColor;
						}

						// Replace short hexidecimal (3 to 4 chars) to long version (6 to 8 chars)
						if (changedColorInput.value.match(/^#[0-9a-f]{3,4}$/i)) {
							const parts = changedColorInput.value
								.slice(1)
								.split('')
								.map((p) => `${p}${p}`);
							const longHex = `#${parts.join('')}`;
							changedColorInput.value = longHex;
						}
						customInput.style.setProperty('--c', changedColorInput.value);

						// Avoid infinite loops
						if (boundColorInput.value === changedColorInput.value) {
							return;
						}

						boundColorInput.value = changedColorInput.value;

						// If the color is invalid, the values will not match
						if (boundColorInput.value !== changedColorInput.value) {
							let invalidColorType = matchingNamedColor;
							if (changedColorInput.value.includes('var(--')) {
								invalidColorType = 'var()';
							} else if (
								changedColorInput.value.includes('rgb(') ||
								changedColorInput.value.includes('rgba(') ||
								changedColorInput.value.includes('hsl(') ||
								changedColorInput.value.includes('hsla(') ||
								changedColorInput.value.includes('hwb(') ||
								changedColorInput.value.includes('hwba(') ||
								changedColorInput.value.includes('lab(') ||
								changedColorInput.value.includes('lch(') ||
								changedColorInput.value.includes('oklab(') ||
								changedColorInput.value.includes('oklch(') ||
								changedColorInput.value.includes('color(')
							) {
								// Any other color function will be passed along
								invalidColorType = 'fn()';
							}
							colorWrap.setAttribute('data-invalid-color', invalidColorType);
						}
					}

					const nodeObj = this.getNodeFromElement(target);
					let changedInput = e.target.closest(this.inputSelectorList);
					let isHiddenCompoundInput = false;
					if (!changedInput) {
						changedInput = e.target.closest('input[type="hidden"][data-compound-from]');
						isHiddenCompoundInput = Boolean(changedInput);
					}

					if (!changedInput) {
						e.preventDefault();
						return;
					}

					const changedInputPort = this.app.querySelector(`[data-port-link="${changedInput.id}"]`);
					let canChangedInputReceiveValue = !changedInput.readOnly;

					// Ensure *-to-many controls properly handle multiple inputs
					if (changedInputPort) {
						const changedPortRelation = changedInputPort.getAttribute('data-port-relation');
						const changedPortDirection = changedInputPort.getAttribute('data-port-direction');

						// This input already has one value (we know this thanks to the readOnly attribute) but can receive more
						if (changedPortRelation === 'many' && changedPortDirection === 'in' && !canChangedInputReceiveValue) {
							const links = this.getInputControlFromList(changedInput);
							this.setInputValueFromControls(changedInput, links.length);
						}
					}

					if (!canChangedInputReceiveValue && !isHiddenCompoundInput) {
						e.preventDefault();
						return;
					}

					if (changedInput.type === 'radio' && changedInput.matches('[data-unit-control]')) {
						// If the unit was changed, nothing needs to happen here but we'll need to recalculate the value
					} else if (changedInput.matches('[data-matrix-input-cell]')) {
						// If a matrix grid cell was changed, update the value in the linked control
						const inputParentMatrixGrid = changedInput.closest('.input-matrix-grid');
						const matrixValues = this.getMatrixValue(inputParentMatrixGrid);
						const gridLinkedInputId = inputParentMatrixGrid.getAttribute('data-matrix-to');
						const gridLinkedInput = this.app.querySelector(`#${gridLinkedInputId}`);
						gridLinkedInput.value = matrixValues.map((row) => row.join(' ')).join('\n');

						triggerChange(gridLinkedInput);
					} else if (changedInput.matches('[data-matrix-size-control]')) {
						// If a control for a grid's size changed, update the grid
						const matrixGridId = changedInput.getAttribute('data-matrix-size-control');
						const matrixGrid = this.app.querySelector(`#${matrixGridId}`);
						const currentGridValues = this.getMatrixValue(matrixGrid);
						const newMatrixSize = changedInput.value;
						const updatedGrid = this.buildMatrix(newMatrixSize, currentGridValues, matrixGrid);

						triggerChange(updatedGrid.querySelector('input')); // Trigger a change on the first cell to recalculate the matrix output
					} else if (isHiddenCompoundInput) {
						// This is not necessary to update as the getOutputValue method will handle it
					} else if (changedInput.matches('[data-compound-part-for]')) {
						const compoundReceiverId = changedInput.getAttribute('data-compound-part-for');
						const compoundReceiver = document.getElementById(compoundReceiverId);
						compoundReceiver.value = this.getCompoundValue(compoundReceiverId);

						triggerChange(compoundReceiver);
					} else {
						const changedInputId = changedInput.id;
						const isPrimitiveRef = changedInput.getAttribute('data-control-type') === fePrimRef;
						if (isPrimitiveRef && (changedInput.value || '').trim().length === 0) {
							// If the value becomes null, repopulate with the initial generated name
							changedInput.value = changedInput.getAttribute('data-primitive-ref');
						}
						const linkedInputs = Array.from(this.app.querySelectorAll(`[data-from-control="${changedInputId}"]`));
						const changedInputValue = this.getOutputValue(changedInput);

						linkedInputs.forEach((input) => {
							const isInteger = input.getAttribute('data-control-type') === '<integer>';
							if (isInteger) {
								// Ensure decimals are dropped for integer fields
								input.value = Math.round(parseFloat(changedInputValue));
							} else {
								// If a primitive reference is renamed, update the option's text label
								if (isPrimitiveRef && input.matches('select') && input.selectedOptions[0]) {
									input.selectedOptions[0].innerText = changedInputValue;
								} else {
									input.value = changedInputValue;
								}
							}

							// For numbers with a min/max value, clamp the result
							if (input.min || input.max) {
								let min = input.min.length > 0 ? parseFloat(input.min) : -Infinity;
								let max = input.max.length > 0 ? parseFloat(input.max) : Infinity;
								input.value = MathClamp(min, parseFloat(input.value), max);
							}

							triggerChange(input);
						});
					}

					const conditionalControls = Array.from(target.querySelectorAll(`[data-control-conditions*='{"attr":"${changedInput.name}"']`));
					if (conditionalControls.length > 0) {
						conditionalControls.forEach((conditionalControl) => {
							const condition = JSON.parse(conditionalControl.getAttribute('data-control-conditions'));
							const nodeControlState = this.getControlConditionalState(conditionalControl, condition);
							this.toggleConditionalControl(conditionalControl, nodeControlState);

							if (!nodeControlState) {
								const closestPort = conditionalControl.closest('[data-port-type]');
								const closestPortId = closestPort ? closestPort.id : false;
								const existingControlPort = closestPortId ? this.app.querySelector(`[data-port-link="${closestPortId}"]`) : false;
								if (existingControlPort) {
									this.unlinkPort(existingControlPort);
								}
							}

							triggerChange(conditionalControl.matches(this.inputSelectorList) ? conditionalControl : conditionalControl.querySelector(this.inputSelectorList));
						});
						this.drawPortLinks();
					}

					this.updateLinkedControls();
				}

				this.updatePreview();

				break;
			}

			case 'submit': {
				e.preventDefault();

				break;
			}

			case 'click': {
				let clearPreviews = true;
				if ((target = e.target.closest('.app-graph-line-action'))) {
					e.preventDefault(); // These are SVG links, clicking with Shift pressed would open in a new tab
					this.graphLines.classList.remove('is-shifted');

					const lineOutputControlId = target.getAttribute('data-link-output');
					const lineInputControlId = target.getAttribute('data-link-input');
					const lineInputPort = this.app.querySelector(`[data-port-link="${lineInputControlId}"]`);
					const lineInput = this.app.querySelector(`#${lineInputControlId}`);

					this.unlinkPort(lineInputPort, lineOutputControlId);
					this.render();
				} else if ((target = e.target.closest('.app-node-tile__preview-button'))) {
					// Get the associated filter ref
					const previewRef = target.closest('.app-node-tile__form')?.querySelector('[name="_node-ref"]')?.value;

					// If the tile doesn't have a preview inserted, clear existing previews and create a new one for the required ref
					if (previewRef && !target.closest('.app-node-tile').querySelector('.app-node-tile__preview-image')) {
						// We don't want to clear this new preview so we'll flag that, and manually remove previews first
						clearPreviews = false;
						this.clearAtStepPreviews();

						const previewAtRef = this.getActiveFilterMarkup(previewRef);
						const previewAtRefMarkup = this.computePreviewMarkup(previewAtRef, { name: `filter-at-step-${previewRef}`, width: 400, height: 250 });
						const previewWrap = el('div', { innerHTML: previewAtRefMarkup.previewCode, className: 'app-node-tile__preview-image' });
						target.closest('.app-node-tile').append(previewWrap);
						target.setAttribute('data-preview-open', true);
					}
				} else if ((target = e.target.closest('[data-create-from-template]'))) {
					const templateRef = target.getAttribute('data-create-from-template');
					const subNodeTemplate = this.sidebarInner.querySelector(`.app-nodes-item > [data-node-ref="${templateRef}"]`);

					this.nodeFromTemplate(subNodeTemplate);
				} else if ((target = e.target.closest('.custom-input'))) {
					if (e.target.closest('input')) {
						this.clearAtStepPreviews();
						return;
					}
					target.querySelector('input[type="text"]')?.focus();
				} else if ((target = e.target.closest('.app-sidebar-toggle'))) {
					const currentExpandState = target.getAttribute('aria-expanded') === 'true';
					const newExpandState = !currentExpandState;
					target.setAttribute('aria-expanded', newExpandState.toString());
					this.sidebar.setAttribute('data-expanded', newExpandState);
					if (newExpandState === false && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
						const transitionDuration = (parseFloat(window.getComputedStyle(this.sidebar).transitionDuration) || 0) * 1000;
						setTimeout(() => this.sidebarDetails.forEach((d) => (d.open = newExpandState)), transitionDuration);
					} else {
						this.sidebarDetails.forEach((d) => (d.open = newExpandState));
					}
				}

				if (clearPreviews) {
					this.clearAtStepPreviews();
				}
				break;
			}

			case 'dblclick': {
				if ((target = e.target.closest('.app-template-tile'))) {
					const newNode = this.nodeFromTemplate(target);
					newNode.focus();
				}
				break;
			}

			case 'keydown': {
				if (document.activeElement.matches('.app-node-tile')) {
					target = document.activeElement;
					const nodeTileData = this.getNodeFromElement(target);
					const position = nodeTileData.position;

					if (e.key.startsWith('Arrow')) {
						if (e.key === 'ArrowUp') {
							position.y -= this.arrowKeyDelta;
							position.y = MathStep(position.y, this.arrowKeyDelta);
						} else if (e.key === 'ArrowDown') {
							position.y += this.arrowKeyDelta;
							position.y = MathStep(position.y, this.arrowKeyDelta);
						} else if (e.key === 'ArrowLeft') {
							position.x -= this.arrowKeyDelta;
							position.x = MathStep(position.x, this.arrowKeyDelta);
						} else if (e.key === 'ArrowRight') {
							position.x += this.arrowKeyDelta;
							position.x = MathStep(position.x, this.arrowKeyDelta);
						}

						this.repositionNodeTile(target, position.x, position.y);
						this.drawPortLinks();
					} else if (['Backspace', 'Delete'].includes(e.key)) {
						this.destroyNodeTile(target, true);
						this.render();
					}
				} else if ((target = document.activeElement.closest('.app-template-tile'))) {
					if (e.key === 'Enter') {
						const newNode = this.nodeFromTemplate(target);
						newNode.focus();
					}
				}
				break;
			}
		}
	}

	showMessage(messageConfig) {
		let msg;
		if (messageConfig.type) {
			switch (messageConfig.type) {
				case 'CYCLIC': {
					msg = 'Potential cyclic reference detected';
					break;
				}
				case 'SELFREF': {
					msg = 'A node cannot reference its own output as an input';
					break;
				}
			}
		} else if (messageConfig.string) {
			msg = messageConfig.string;
		}

		if (msg) {
			// TODO Show a little toast popup or something to show errors instead?
			window.alert(msg);
		}
	}

	/** Create a cyclical */
	getNodeGraphFromLeaves(leafNodes, leafIndexRef = 1) {
		// Find nodes that have no outgoing data from their result control
		let graph = {};

		leafNodes.forEach((leafNode, leafIndex) => {
			leafNode._index = `${String(leafIndexRef).padStart(2, '0')}.${String(leafIndex).padStart(2, '0')}`;
			const nodeRef = leafNode.nodeData.uniqueRef;
			const nodeIn = document.getElementById(this.getOutputValue(leafNode.controls.in?.querySelector(`[name="in"]`), 'refId'));
			const nodeIn2 = document.getElementById(this.getOutputValue(leafNode.controls.in2?.querySelector(`[name="in2"]`), 'refId'));
			const nodeInList = ArrayUnique([nodeIn, nodeIn2])
				.filter(Boolean)
				.map((inEl) => this.getNodeFromElement(inEl)); // Get the parent node and deduplicate if they are identical

			graph[nodeRef] = {
				node: leafNode,
				dependsOn: this.getNodeGraphFromLeaves(nodeInList, leafIndexRef + 1),
			};
		});

		return graph;
	}

	nodeObjToJSON(nodeObj) {
		const node = nodeObj.node;
		const dependsOn = nodeObj.dependsOn;

		return {
			ref: node.nodeData.ref,
			pos: node.nodeData.position,
			idx: node._index,
			ctrl: Object.fromEntries(
				Object.entries(node.controls).map(([attr, control]) => {
					return [attr, this.getOutputValue(control.querySelector(`[name="${attr}"]`), true)];
				})
			),
			dep: Object.entries(dependsOn).map(([nodeUniqueRef, dep]) => this.nodeObjToJSON(dep)),
		};
	}

	nodeGraphToJSON(graph) {
		return JSON.stringify(Object.entries(graph).map(([nodeUniqueRef, nodeLeaf]) => this.nodeObjToJSON(nodeLeaf)));
	}

	populateGraph(graph) {
		// TODO
	}

	getActiveFilterMarkup(stopAtRef = null) {
		// We'll create our filter primitives in a temporary `svg > filter` DOM structure
		const tempSvgEl = el('svg', {}, 'svg');
		const tempFilterEl = el('filter', {}, 'svg');
		tempSvgEl.append(tempFilterEl);

		// Grab all the nodes that are a filter primitive
		const activeFilters = Object.entries(this.activeNodes)
			.map(([ref, info]) => info)
			.filter((info) => {
				return info.nodeData.category === 'primitives';
			});

		// Find the end-of-tree nodes to start the backwards graph building
		const leafNodes = activeFilters.filter((f) => {
			return f.controls.result && f.controls.result.querySelector('[data-port-direction="out"]').matches('[data-port-connected="true"]') === false;
		});
		const nodeGraph = this.getNodeGraphFromLeaves(leafNodes); // This will index each node by mutating the node object with an _index property

		// Store the graph configuration so it can be restored upon page load
		// this.storedGraph = nodeGraph; // TODO

		// If there are no leaf nodes, and a primitive output exists with a connected port, then a potential cyclic dependency exists
		if (leafNodes.length === 0 && this.graph.querySelectorAll('[data-control-type="<filter-primitive-reference>"] + [data-port-connected="true"]').length > 0) {
			this.showMessage({ type: 'CYCLIC' });
		}

		// Sort the nodes by the _index property, then reverse them
		const filtersSortedFirstToLast = Array.from(activeFilters)
			.sort((a, b) => (a._index || '0').localeCompare(b._index || '0'))
			.reverse();

		const feMap = {};
		let skipNodes = false;

		filtersSortedFirstToLast.forEach((filter) => {
			if (skipNodes) {
				return;
			}
			const nodeForm = filter.nodeElement.querySelector('.app-node-tile__form');
			const nodeFormData = getFormData(nodeForm);
			const fePrimitive = el(filter.nodeData.ref, {}, 'svg');
			const controls = filter.controls;
			let result;

			for (let control in controls) {
				const controlEl = controls[control];
				const controlInput = controlEl.querySelector(`[name="${control}"]`);
				const connectedLinkedPort = this.app.querySelector(`[data-port-link="${controlInput.id}"][data-port-direction="out"][data-port-connected="true"]`);

				if (controlInput.getAttribute('name') === 'result' && !connectedLinkedPort) {
					// If there is no link on the result, don't pass the result into an attribute
				} else {
					let attrValue = this.getOutputValue(controlInput);
					let valueUnit = '';

					// For incoming values, ensure the reference is dynamically fetched
					if (['in', 'in2'].includes(controlInput.getAttribute('name'))) {
						if (attrValue === fePrimRef) {
							const linkedControlId = Array.from(controlInput.options)
								.find((opt) => opt.value === attrValue)
								.getAttribute('data-dynamic-option-ref');
							const linkedControl = document.getElementById(linkedControlId);
							attrValue = this.getOutputValue(linkedControl);
						}
					} else if (controlInput.getAttribute('name') === 'result') {
						result = this.getOutputValue(controlInput);
					}

					// If this is a unit-controlled input, attach the unit
					if (controlInput.matches('[data-unit-control]')) {
						const unitControlId = controlInput.getAttribute('data-unit-control');
						const unitControlName = document.getElementById(unitControlId).getAttribute('data-unit-name');
						valueUnit = nodeFormData[unitControlName];
					}

					// Ensure conditional attributes are skipped if they are hidden
					const isActiveControl = this.getControlConditionalState(filter.nodeElement, control);
					const isNestedFilterResult = control === 'result' && filter.nodeData.nested;
					if (!isActiveControl || isNestedFilterResult) {
						continue;
					}

					const isNestedNodes = control === 'nestedNodes';
					const isPrivateAttr = control.startsWith('_');
					const isEmptyValue = String(attrValue).length === 0;
					const isHiddenCondition = controlInput.closest('[data-control-conditions]')?.hidden === true;

					// Ignore nested nodes as a visible attribute, ignore _private attributes, ignore empty attributes, ignore hidden conditional attributes
					if (isNestedNodes || isPrivateAttr || isEmptyValue || isHiddenCondition) {
						continue;
					}

					// Attach the value
					fePrimitive.setAttribute(control, `${attrValue}${valueUnit}`.trim());
				}
			}

			feMap[filter.nodeData.uniqueRef] = {
				primitive: filter.nodeData.ref,
				element: fePrimitive,
				children: controls.nestedNodes ? this.getInputControlFromList(controls.nestedNodes.querySelector(`[name="nestedNodes"]`)) : null,
				isNested: Array.isArray(filter.nodeData.nested) && filter.nodeData.nested.length > 0,
				result: result,
			};

			if (stopAtRef && stopAtRef === nodeFormData['_node-ref']) {
				skipNodes = true;
			}
		});

		for (let feItem in feMap) {
			const feData = feMap[feItem];
			const feEl = feData.element;

			if (Array.isArray(feData.children) && feData.children.length > 0) {
				for (let childId of feData.children) {
					const controlNode = this.getNodeFromElement(document.getElementById(childId));
					const childFeId = controlNode.nodeElement.id;

					// If a node is linked to a feMerge node, don't place the node inside feMerge, and instead create a feMergeNode referencing the node's result
					if (feData.primitive === 'feMerge' && feMap[childFeId].primitive !== 'feMergeNode' && feMap[childFeId].result) {
						feEl.append(el('feMergeNode', { in: feMap[childFeId].result }, 'svg'));
						tempFilterEl.append(feEl); // Place the feMerge node after the referenced node
					} else {
						feEl.append(feMap[childFeId].element);
					}
				}
			}

			if (!feData.isNested) {
				tempFilterEl.append(feEl);
			}
		}

		// Grab the HTML, and remove the temporary DOM holding the markup
		const markup = (tempFilterEl.innerHTML || '').trim();
		tempSvgEl.remove(); // Also removes the nested tempFilterEl element

		return markup;
	}

	computePreviewMarkup(filterMarkup, filterOptions = {}) {
		const filterName = filterOptions.name || 'svgfm-filter';
		const previewWidth = filterOptions.width || 300;
		const previewHeight = filterOptions.height || 150;
		const filterAttr = filterMarkup ? `filter="url(#${filterName})"` : '';
		const previewType = this.getPreviewType();
		const previewEl =
			previewType === 'image'
				? `<image href="./sample.jpg" x="50%" y="50%" width="300" height="150" transform="translate(-150 -75)" ${filterAttr} />`
				: `<text x="50%" y="50%" text-anchor="middle" ${filterAttr} fill="currentColor" font-size="32">Sample Text Effect</text>`;
		const filterDef = `<filter id="${filterName}">${filterMarkup}</filter>`;

		const previewCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${previewWidth} ${previewHeight}" width="${previewWidth}" height="${previewHeight}">
			<title>A preview of the SVG filter with ${previewType}</title>
			<defs>${filterDef}</defs>
			${previewEl}
		</svg>`;

		return { filterDef, previewCode };
	}

	clearAtStepPreviews() {
		// Clear out existing mini at-step previews
		Array.from(this.graph.querySelectorAll('.app-node-tile__preview-button[data-preview-open]')).forEach((btn) => btn.removeAttribute('data-preview-open'));
		Array.from(this.graph.querySelectorAll('.app-node-tile__preview-image')).forEach((prev) => prev.remove());
	}

	/** Update the preview by generating the code and refreshing the preview accordingly */
	updatePreview() {
		this.clearAtStepPreviews();
		const filterMarkup = this.getActiveFilterMarkup();
		const previewWidth = this.previewWindow.clientWidth;
		const previewHeight = this.previewWindow.clientHeight;
		const previewMarkup = this.computePreviewMarkup(filterMarkup, { width: 400, height: 250 });
		const filterDef = previewMarkup.filterDef;
		const previewCode = previewMarkup.previewCode;

		const defCode = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs>${filterDef}</defs></svg>`;
		const defDOM = el('div', { innerHTML: defCode });
		autoTab(defDOM);

		this.previewCode.innerHTML = defDOM.innerHTML.trim();
		this.previewWindow.innerHTML = previewCode;
		defDOM.remove(); // We've used its innerHTML, it can be discarded
	}

	reset() {
		if (window.confirm('This will delete every node on the canvas and reset your filter. Are you sure?')) {
			for (let nodeRef in this.activeNodes) {
				const nodeInfo = this.activeNodes[nodeRef];
				this.destroyNodeTile(nodeInfo.nodeElement);
			}

			this.storedGraph = null;
		}

		this.render();
	}

	render() {
		this.drawPortLinks();
		this.extendGraphArea();
		this.updatePreview();
	}
}
