const feAttrs = {
	in: {
		value: ['SourceGraphic', 'SourceAlpha', 'BackgroundImage', 'BackgroundAlpha', 'FillPaint', 'StrokePaint', '<filter-primitive-reference>'],
		flow: 'in',
	},
	result: {
		value: '<filter-primitive-reference>',
		flow: 'out',
	},
	nestedNodes: {
		value: '<primitive-reference-list>',
		flow: 'in',
		flowRelation: 'many',
	},
	boolean: {
		value: ['true', 'false'],
		default: 'false',
	},
	string: {
		value: '<string>',
		default: '',
		flow: 'in',
	},
	number: {
		value: '<number>',
		default: 0,
		flow: 'in',
	},
	integer: {
		value: '<integer>',
		default: 0,
		flow: 'in',
	},
	numberOptionalNumber: {
		value: '<number-optional-number>',
		subAttrs: {
			_number: {
				label: 'X',
				attrType: {
					value: '<number-positive>',
				},
				required: true,
				default: '0',
			},
			_optionalNumber: {
				label: 'Y',
				attrType: {
					value: '<number-positive>',
				},
				default: '',
			},
		},
	},
	color: {
		value: '<color>',
		default: '#ff0000',
		flow: 'in',
		placeholder: '#d00dad',
	},
	opacity: {
		value: '<alpha-value>',
		default: 1,
		flow: 'in',
	},
	href: {
		value: '<iri>',
		flow: 'in',
		placeholder: '#ref or https://…',
		default: './icon.svg',
	},
	blendMode: {
		value: [
			'normal',
			'multiply',
			'screen',
			'overlay',
			'darken',
			'lighten',
			'color-dodge',
			'color-burn',
			'hard-light',
			'soft-light',
			'difference',
			'exclusion',
			'hue',
			'saturation',
			'color',
			'luminosity',
		],
		default: 'normal',
	},
	type_colorMatrix: {
		label: 'Color Matrix Type',
		value: ['matrix', 'saturate', 'hueRotate', 'luminanceToAlpha'],
	},
	type_turbulence: {
		label: 'Turbulence Type',
		value: ['fractalNoise', 'turbulence'],
	},
	type_func: {
		label: 'Function Type',
		value: ['identity', 'table', 'discrete', 'linear', 'gamma'],
	},
	matrix: {
		value: '<identity-matrix>',
	},
	numberList: {
		value: '<number-list>',
		flow: 'in',
	},
	operator_composite: {
		value: ['over', 'in', 'out', 'atop', 'xor', 'lighter', 'arithmetic'],
		default: 'over',
	},
	operator_morprhology: {
		value: ['erode', 'dilate'],
		default: 'erode',
	},
	order: {
		value: '<number-optional-number>',
		flow: 'in',
	},
	divisor: {
		value: '<number>',
		flow: 'in',
		default: '1',
	},
	edgeMode: {
		value: ['duplicate', 'wrap', 'none'],
	},
	kernelUnitLength: {
		value: '<number-optional-number>',
		flow: 'in',
	},
	surfaceScale: {
		value: '<number>',
		default: 1,
		flow: 'in',
	},
	diffuseConstant: {
		value: '<number>',
		default: 1,
		flow: 'in',
	},
	channelSelector: {
		value: ['R', 'G', 'B', 'A'],
		default: 'A',
	},
	scale: {
		value: '<number>',
		default: 1,
		flow: 'in',
	},
	crossorigin: {
		label: 'Cross-Origin',
		value: ['', 'anonymous', 'use-credentials'],
		labels: ['(empty)', undefined, undefined],
	},
	preserveAspectRatio: {
		value: '<custom:compound-value>',
		label: 'Preserve Aspect Ratio',
		subAttrs: {
			align: {
				label: 'Alignment',
				attrType: {
					value: ['none', 'xMinYMin', 'xMidYMin', 'xMaxYMin', 'xMinYMid', 'xMidYMid', 'xMaxYMid', 'xMinYMax', 'xMidYMax', 'xMaxYMax'],
				},
				default: 'xMidYMid',
			},
			meetOrSlice: {
				label: 'Meet or Slice',
				attrType: {
					value: ['meet', 'slice'],
				},
				default: 'meet',
			},
		},
	},
	stitch: {
		value: ['stitch', 'noStitch'],
		labels: ['on', 'off'],
		default: 'noStitch',
	},
};

const feColorFuncAttrs = {
	type: { attrType: feAttrs.type_func },
	tableValues: {
		attrType: feAttrs.numberList,
		conditions: [
			{ attr: 'type', value: 'table' },
			{ attr: 'type', value: 'discrete' },
		],
	},
	slope: {
		attrType: feAttrs.number,
		conditions: [{ attr: 'type', value: 'linear' }],
	},
	intercept: {
		attrType: feAttrs.number,
		conditions: [{ attr: 'type', value: 'linear' }],
	},
	amplitude: {
		attrType: feAttrs.number,
		conditions: [{ attr: 'type', value: 'gamma' }],
	},
	exponent: {
		attrType: feAttrs.number,
		conditions: [{ attr: 'type', value: 'gamma' }],
	},
	offset: {
		attrType: feAttrs.number,
		conditions: [{ attr: 'type', value: 'gamma' }],
	},
	result: { attrType: Object.assign({}, feAttrs.result, { flowRelation: 'one' }) },
};

// List of attributes which can use various units
const feAttrUnits = {
	width: { primitives: ['feFlood', 'feImage', 'feTile'], options: ['', '%'] },
	height: { primitives: ['feFlood', 'feImage', 'feTile'], options: ['', '%'] },
	x: { primitives: ['feFlood', 'feImage', 'feTile'], options: ['', '%'] },
	y: { primitives: ['feFlood', 'feImage', 'feTile'], options: ['', '%'] },
};

const fePrimitives = [
	{
		ref: 'feBlend',
		label: 'Blend',
		attrs: {
			in: { attrType: feAttrs.in },
			in2: { attrType: feAttrs.in },
			mode: { attrType: feAttrs.blendMode, label: 'Blend Mode' },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feColorMatrix',
		label: 'Color Matrix',
		attrs: {
			in: { attrType: feAttrs.in },
			type: { attrType: feAttrs.type_colorMatrix },
			values: {
				attrType: {
					value: '<custom:compound-value>',
					subAttrs: {
						_matrix: {
							label: 'Matrix',
							attrType: feAttrs.matrix,
							size: '5,4',
							default: ['0 1 0 0 0', '0.5 0 0 0 0', '0.1 0 0 0 0', '0 0 0 0 1'].map((row) => row.split(' ').map((num) => parseFloat(num))),
							conditions: [{ attr: 'type', value: 'matrix' }],
						},
						_numbers_saturate: {
							label: 'Saturation',
							attrType: feAttrs.opacity,
							default: '1',
							conditions: [{ attr: 'type', value: 'saturate' }],
						},
						_numbers_hue: {
							label: 'Numbers',
							attrType: feAttrs.number,
							default: '0',
							step: 1,
							conditions: [{ attr: 'type', value: 'hueRotate' }],
						},
					},
				},
				conditions: [
					{ attr: 'type', value: 'saturate' },
					{ attr: 'type', value: 'hueRotate' },
					{ attr: 'type', value: 'matrix' },
				],
			},
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feComponentTransfer',
		label: 'Component Transfer',
		attrs: {
			in: { attrType: feAttrs.in },
			nestedNodes: { attrType: feAttrs.nestedNodes, label: 'Color Channel Functions', word: 'channel', plural: 'channels', isCustomAttribute: true },
			result: { attrType: feAttrs.result },
		},
	},
	{
		nested: ['feComponentTransfer'],
		nestCountLimit: 1,
		ref: 'feFuncR',
		label: 'Red',
		attrs: feColorFuncAttrs,
	},
	{
		nested: ['feComponentTransfer'],
		nestCountLimit: 1,
		ref: 'feFuncG',
		label: 'Green',
		attrs: feColorFuncAttrs,
	},
	{
		nested: ['feComponentTransfer'],
		nestCountLimit: 1,
		ref: 'feFuncB',
		label: 'Blue',
		attrs: feColorFuncAttrs,
	},
	{
		nested: ['feComponentTransfer'],
		nestCountLimit: 1,
		ref: 'feFuncA',
		label: 'Alpha',
		attrs: feColorFuncAttrs,
	},
	{
		ref: 'feComposite',
		label: 'Composite',
		attrs: {
			in: { attrType: feAttrs.in },
			in2: { attrType: feAttrs.in },
			operator: { attrType: feAttrs.operator_composite },
			k1: { attrType: feAttrs.number, conditions: [{ attr: 'operator', value: 'arithmetic' }] },
			k2: { attrType: feAttrs.number, conditions: [{ attr: 'operator', value: 'arithmetic' }] },
			k3: { attrType: feAttrs.number, conditions: [{ attr: 'operator', value: 'arithmetic' }] },
			k4: { attrType: feAttrs.number, conditions: [{ attr: 'operator', value: 'arithmetic' }] },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feConvolveMatrix',
		label: 'Convolve Matrix',
		attrs: {
			in: { attrType: feAttrs.in },
			order: { attrType: feAttrs.numberOptionalNumber, default: ['3', ''] },
			kernelMatrix: {
				label: 'Matrix (orderX × orderY)',
				attrType: feAttrs.matrix,
				sizeFrom: 'order',
				size: 3,
				default: ['-1 0 0', '0 0 0', '0 0 1'].map((row) => row.split(' ').map((num) => parseFloat(num))),
			},
			divisor: { attrType: feAttrs.divisor },
			bias: { attrType: feAttrs.number },
			targetX: { attrType: feAttrs.integer, default: 1 },
			targetY: { attrType: feAttrs.integer, default: 1 },
			edgeMode: { attrType: feAttrs.edgeMode, default: 'duplicate' },
			kernelUnitLength: { attrType: feAttrs.numberOptionalNumber },
			preserveAlpha: { attrType: feAttrs.boolean },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feDiffuseLighting',
		label: 'Diffuse Lighting',
		attrs: {
			in: { attrType: feAttrs.in },
			surfaceScale: { attrType: feAttrs.surfaceScale },
			diffuseConstant: { attrType: feAttrs.diffuseConstant },
			kernelUnitLength: { attrType: feAttrs.numberOptionalNumber, default: ['', ''] },
			'lighting-color': { attrType: feAttrs.color, default: '#ffffff' },
			nestedNodes: { attrType: feAttrs.nestedNodes, label: 'Light Sub-Nodes', word: 'light', plural: 'lights', isCustomAttribute: true },
			result: { attrType: feAttrs.result },
		},
	},
	{
		nested: ['feDiffuseLighting', 'feSpecularLighting'],
		ref: 'feDistantLight',
		label: 'Distant Light',
		attrs: {
			azimuth: { attrType: feAttrs.number },
			elevation: { attrType: feAttrs.number },
			result: { attrType: Object.assign({}, feAttrs.result, { flowRelation: 'one' }), label: 'Light Sub-Node' },
		},
	},
	{
		nested: ['feDiffuseLighting', 'feSpecularLighting'],
		ref: 'fePointLight',
		label: 'Point Light',
		attrs: {
			x: { attrType: feAttrs.number },
			y: { attrType: feAttrs.number },
			z: { attrType: feAttrs.number },
			result: { attrType: Object.assign({}, feAttrs.result, { flowRelation: 'one' }), label: 'Light Sub-Node' },
		},
	},
	{
		ref: 'feDisplacementMap',
		label: 'Displacement Map',
		attrs: {
			in: { attrType: feAttrs.in, label: 'in (image)' },
			in2: { attrType: feAttrs.in, label: 'in2 (map)' },
			scale: { attrType: feAttrs.scale },
			xChannelSelector: { attrType: feAttrs.channelSelector },
			yChannelSelector: { attrType: feAttrs.channelSelector },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feDropShadow',
		label: 'Drop Shadow',
		attrs: {
			in: { attrType: feAttrs.in },
			dx: { attrType: feAttrs.number, default: 2, label: 'Horizontal Offset' },
			dy: { attrType: feAttrs.number, default: 2, label: 'Vertical Offset' },
			stdDeviation: { attrType: feAttrs.numberOptionalNumber, label: 'Blur Amount' },
			'flood-color': { attrType: feAttrs.color, label: 'Color' },
			'flood-opacity': { attrType: feAttrs.opacity, label: 'Opacity' },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feFlood',
		label: 'Flood',
		attrs: {
			x: { attrType: feAttrs.number },
			y: { attrType: feAttrs.number },
			width: { attrType: feAttrs.number, default: 100 },
			height: { attrType: feAttrs.number, default: 100 },
			'flood-color': { attrType: feAttrs.color, label: 'Color' },
			'flood-opacity': { attrType: feAttrs.opacity, label: 'Opacity' },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feGaussianBlur',
		label: 'Gaussian Blur',
		attrs: {
			in: { attrType: feAttrs.in },
			stdDeviation: { attrType: feAttrs.numberOptionalNumber, label: 'Blur Amount' },
			edgeMode: { attrType: feAttrs.edgeMode, default: 'none', label: 'Edge Mode' },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feImage',
		label: 'Image',
		attrs: {
			href: { attrType: feAttrs.href },
			crossorigin: { attrType: feAttrs.crossorigin },
			preserveAspectRatio: { attrType: feAttrs.preserveAspectRatio },
			x: { attrType: feAttrs.number },
			y: { attrType: feAttrs.number },
			width: { attrType: feAttrs.number, default: 100 },
			height: { attrType: feAttrs.number, default: 100 },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feMerge',
		label: 'Merge',
		attrs: {
			nestedNodes: { attrType: feAttrs.nestedNodes, label: 'Nodes', isCustomAttribute: true },
			result: { attrType: feAttrs.result },
		},
	},
	{
		nested: ['feMerge'],
		ref: 'feMergeNode',
		label: 'Merge Node',
		attrs: {
			in: { attrType: Object.assign({}, feAttrs.in, { flowRelation: 'one' }), flow: 'out', label: 'Graphic' },
		},
	},
	{
		ref: 'feMorphology',
		label: 'Morphology',
		attrs: {
			in: { attrType: feAttrs.in },
			operator: { attrType: feAttrs.operator_morprhology },
			// radius: { attrType: feAttrs.numberOptionalNumber },
			radius: {
				attrType: feAttrs.numberOptionalNumber,
				default: 0,
			},
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feOffset',
		label: 'Offset',
		attrs: {
			in: { attrType: feAttrs.in },
			dx: { attrType: feAttrs.number, default: 2, label: 'Horizontal Offset' },
			dy: { attrType: feAttrs.number, default: 2, label: 'Vertical Offset' },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feSpecularLighting',
		label: 'Specular Lighting',
		attrs: {
			in: { attrType: feAttrs.in },
			surfaceScale: { attrType: feAttrs.surfaceScale },
			specularConstant: { attrType: feAttrs.number, default: 1 },
			specularExponent: { attrType: feAttrs.number, default: 1 },
			kernelUnitLength: { attrType: feAttrs.numberOptionalNumber },
			nestedNodes: { attrType: feAttrs.nestedNodes, label: 'Light Sub-Nodes', word: 'light', plural: 'lights', isCustomAttribute: true },
			result: { attrType: Object.assign({}, feAttrs.result, { flowRelation: 'one' }) },
		},
	},
	{
		nested: ['feDiffuseLighting', 'feSpecularLighting'],
		ref: 'feSpotlight',
		label: 'Spotlight',
		attrs: {
			x: { attrType: feAttrs.number },
			y: { attrType: feAttrs.number },
			z: { attrType: feAttrs.number },
			pointsAtX: { attrType: feAttrs.number },
			pointsAtY: { attrType: feAttrs.number },
			pointsAtZ: { attrType: feAttrs.number },
			specularExponent: { attrType: feAttrs.number, default: 1 },
			limitingConeAngle: { attrType: feAttrs.number },
			result: { attrType: Object.assign({}, feAttrs.result, { flowRelation: 'one' }), label: 'Light Sub-Node' },
		},
	},
	{
		ref: 'feTile',
		label: 'Tile',
		attrs: {
			in: { attrType: feAttrs.in },
			x: { attrType: feAttrs.number },
			y: { attrType: feAttrs.number },
			width: { attrType: feAttrs.number, default: 100 },
			height: { attrType: feAttrs.number, default: 100 },
			result: { attrType: feAttrs.result },
		},
	},
	{
		ref: 'feTurbulence',
		label: 'Turbulence',
		attrs: {
			type: { attrType: feAttrs.type_turbulence },
			baseFrequency: { attrType: feAttrs.numberOptionalNumber, default: [0.05], label: 'Frequency' },
			numOctaves: { attrType: feAttrs.integer, default: 1, label: 'Octaves' },
			seed: { attrType: feAttrs.number, label: 'Random Seed' },
			stitchTiles: { attrType: feAttrs.stitch, label: 'Stitch Tiles' },
			result: { attrType: feAttrs.result },
		},
	},
];

const SVGAttributesMap = { attrs: feAttrs, primitives: fePrimitives, unitOptions: feAttrUnits };
