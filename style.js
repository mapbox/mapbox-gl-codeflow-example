#!/usr/bin/env node

// An example of generating a style from a node.js script.
// Since this is a fully-functional imperative language, we can use
// modules, constants, and the like.
var chroma = require('chroma-js');

var WATER_COLOR = '#ace';
var BACKGROUND = chroma(WATER_COLOR).darken().hex();

var style = {
  'version': 7,
  'name': 'Basic',
  'constants': {},
  'sources': {
    'mapbox': {
      'type': 'vector',
      'url': 'mapbox://mapbox.mapbox-streets-v6'
    }
  },
  'sprite': '',
  'glyphs': '',
  'layers': [{
    'id': 'background',
    'type': 'background',
    'paint': {
      'background-color': BACKGROUND
    }
  }, {
    'id': 'water',
    'type': 'fill',
    'source': 'mapbox',
    'source-layer': 'water',
    'paint': {
      'fill-color': WATER_COLOR
    }
  }]
};

process.stdout.write(JSON.stringify(style, null, 4));
