// Part of The Forest
// Copyright (c) Graham Relf, UK, 2014
// www.grelf.net
'use strict';

function Screen ()
{ if (!!document.createElement ("canvas").getContext)
  { this.canvas = document.getElementById ("map");
    this.wd = this.canvas.width;
    this.ht = this.canvas.height;
    this.g2 = this.canvas.getContext ("2d");
    this.im = this.g2.createImageData (this.wd, this.ht);
    this.alphaLUT = new Array (256); // Convert index 0..255 to 0..1
    for (var i = 0; i < 256; i++) this.alphaLUT [i] = i / 255;
  }
  else forest.infoDiv.innerHTML = "ERROR: Could not create graphics context";
}

Screen.prototype.display = function ()
{ this.g2.putImageData (this.im, 0, 0); };

/** Returns an array with 4 elements: RGBA. */
Screen.prototype.getPixel = function (x, y)
{ var i = (this.wd * Math.round (y) + Math.round (x)) * 4;
  // NB: JavaScript will try to index arrays with non-integers!
  return [this.im.data [i], this.im.data [i + 1], this.im.data [i + 2], this.im.data [i + 3]];
};

/** rgba is an array with 4 elements: RGBA.
  * Ignores transparent pixels (A = 0). */
Screen.prototype.setPixel = function (x, y, rgba)
{ var i = (this.wd * Math.round (y) + Math.round (x)) * 4;
  if (0 === rgba [3]) return;
  var r = this.im.data [i];
  var g = this.im.data [i + 1];
  var b = this.im.data [i + 2];
  var a01 = this.alphaLUT [rgba [3]];
  var a10 = 1 - a01; 
  this.im.data [i] = (a10 * r + a01 * rgba [0]) & 0xff;
  this.im.data [i + 1] = (a10 * g + a01 * rgba [1]) & 0xff;
  this.im.data [i + 2] = (a10 * b + a01 * rgba [2]) & 0xff;
  this.im.data [i + 3] = 255;
};
