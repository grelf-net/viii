// Part of The Forest
// Copyright (c) Graham Relf, UK, 2014
// www.grelf.net
'use strict';

function WorkArea (width, height)
{ if (!!document.createElement ("canvas").getContext)
  { this.canvas = document.createElement ("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.wd = width;
    this.ht = height;
    this.g2 = this.canvas.getContext ("2d");
    this.im = this.g2.createImageData (this.wd, this.ht);
  }
  else forest.infoDiv.innerHTML = "ERROR: Could not create work area";
}

/** Get pixel data by drawing the image into a graphics context.
  * Set image.gdat and return ref to it (RGBA row-wise from top left). */
WorkArea.prototype.getImageData = function (image)
{ this.g2.drawImage (image, 0, 0);
  image.gdat = this.g2.getImageData (0, 0, image.width, image.height).data;
  return image.gdat;
};

// Returns 4-element array: RGBA. Assumes image.gdat has been defined
// NB: JavaScript can index arrays with non-integers!
Image.prototype.getPixel = function (x, y)
{ var i = (this.width * Math.round (y) + Math.round (x)) * 4;
  return [this.gdat [i], this.gdat [i + 1], this.gdat [i + 2], this.gdat  [i + 3]];
};

// rgba is a 4-element array: RGBA. Assumes image.gdat has been defined
Image.prototype.setPixel = function (x, y, rgba)
{ var i = (this.width * Math.round (y) + Math.round (x)) * 4;
  this.gdat [i] = rgba [0];
  this.gdat [i + 1] = rgba [1];
  this.gdat [i + 2] = rgba [2];
  this.gdat [i + 3] = rgba [3];
};

Image.prototype.makeSilhouette = function ()
{ var cnv = document.createElement ('canvas');
  cnv.width = this.width;
  cnv.height = this.height;
  var g2 = cnv.getContext ('2d');
  g2.drawImage (this, 0, 0);
  var imData = g2.getImageData (0, 0, this.width, this.height);
  var px = imData.data;
  for (var i = 0; i < px.length; i++)
  { var i3 = i + 3;
    if (0 === px [i3]) i = i3; // skip transparent px
    else for (var j = 0; j < 3; j++) { px [i] = 0; i++;}
  } // loop inc skips alpha
  g2.putImageData (imData, 0, 0);
  var sil = new Image ();
  sil.onload = function () 
  { sil.loaded = true;       
    sil.foggy = new Array (8);
    sil.foggy [0] = sil;
    forest.workarea.getImageData (sil);
  }
  sil.src = cnv.toDataURL ('image/png');
  return sil;
};

/** Map part of image into perspective shape defined by points
  * topleft, bottomleft, topright & bottom right (.x and .y).
  * Bottom must have higher y than top.
  * Left & right edges remain vertical (tL.x == bL.x and tR.x == bR.x).
  * Last 2 arguments optional: if omitted the whole width of source image is used.
  * Assumes image.gdat has been defined by using WorkArea.getImageData (image). */
function skewHoriz (image, tL, bL, tR, bR, srcMinX, srcMaxX)
{ if (tL.x !== bL.x || tR.x !== bR.x) { message ("Non-vertical edges for skewHoriz"); return; }
  if (bL.y < tL.y || bR.y < tR.y) { message ("y coords reversed for skewHoriz"); return; }
  if (arguments.length < 7) { srcMinX = 0; srcMaxX = image.width - 1; }
  var srcHt = image.height, dstWd = tR.x - tL.x;
  var dyT = (tR.y - tL.y) / dstWd, dyB = (bR.y - bL.y) / dstWd;
  var dSrcX = (srcMaxX - srcMinX) / dstWd, fs = forest.screen;
  try
  { if (tL.x < tR.x)
    { // Vertical strips, varying length, left to right:
      for (var dstX = tL.x, srcX = srcMinX, dstYT = tL.y, dstYB = bL.y;
           (dstX <= tR.x) && (srcX <= srcMaxX); dstX++)
      { if (dstX >= 0 && dstX < fs.wd)
        { var dSrcY = srcHt / (dstYB - dstYT);
          for (var dstY = dstYT, srcY = 0; (dstY <= dstYB) && (srcY < srcHt); dstY++)
          { if (dstY >= 0 && dstY < fs.ht) fs.setPixel (dstX, dstY, image.getPixel (srcX, srcY));
            srcY += dSrcY;
        } }
        srcX += dSrcX; dstYT += dyT; dstYB += dyB;
    } }
    else
    { // Right to left:
      for (var dstX = tL.x, srcX = srcMaxX, dstYT = tL.y, dstYB = bL.y;
           (dstX >= tR.x) && (srcX >= srcMinX); dstX--)
      { if (dstX >= 0 && dstX < fs.wd)
        { var dSrcY = srcHt / (dstYB - dstYT);
          for (var dstY = dstYT, srcY = 0; (dstY <= dstYB) && (srcY < srcHt); dstY++)
          { if (dstY >= 0 && dstY < fs.ht) fs.setPixel (dstX, dstY, image.getPixel (srcX, srcY));
            srcY += dSrcY;
        } }
        srcX -= dSrcX; dstYT += dyT; dstYB += dyB;
  } } }
  catch (ex) { message (ex.toString ()); }
}