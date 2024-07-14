// Part of The Forest
// Copyright (c) Graham Relf, UK, 2019
// www.grelf.net
'use strict';

/** One object of this type is constructed at the start to avoid reallocating
  * big arrays every time a scene is drawn */
function Around ()
{ var el = document.getElementById ("range");
  this.aMid = 0;
  for (var i = 0; i < el.options.length; i++) // Find largest range possible
  { var r = parseInt (el.options [i].value); if (r > this.aMid) this.aMid = r; }
  var wd = 2 * this.aMid + 1;
  this.around = new Array (wd);
  for (var x = 0; x < wd; x++) 
  { this.around [x] = new Array (wd); 
    for (var y = 0; y < wd; y++)
    { this.around [x][y] = new ScenePoint (0, 0, 0, 0, 0); }
  }
  this.xyd = setSortedDistances (this.aMid);//ES
}

//ES:
function setSortedDistances (range)
{ var xyd = [], x2, y2;
  for (var y = -range; y <= range; y++)
  { y2 = y * y;
    for (var x = -range; x <= range; x++)
    { x2 = x * x;
      xyd.push ({x:x, y:y, d:Math.sqrt (x2 + y2), b:Math.atan2 (x, y) * RAD2DEG});
    }
  }
  xyd.sort (function (a, b) { return a.d - b.d; });//Nearest first
  return xyd;
};

Around.prototype.lookupXYD = function (i) { return this.xyd [i]; };//:ES

/** Use at the start of drawing a new scene
  * NB: mex, mey are rounded observer coordinates */
Around.prototype.init = function (mex, mey)
{ this.xOffset = this.aMid - mex; this.yOffset = this.aMid - mey; };

/** Get a reference to the ScenePoint object at (x, y) */
Around.prototype.aroundGet = function (x, y)
{ return this.around [x + this.xOffset][y + this.yOffset]; };

/** Set fields of the ScenePoint at (x, y) and return it */
Around.prototype.aroundSet = function (distance, bearing, x, y, odd)
{ var sp = this.around[x + this.xOffset][y + this.yOffset];
  sp.fogNo = 0;
  sp.tr = undefined;
  sp.building = undefined;
  sp.drawn = undefined;
  sp.clear = undefined;
  sp.d = distance;
  sp.b = bearing;
  sp.x = x;
  sp.y = y;
  sp.o = odd;
  sp.ahead = false;//ES
  return sp;//ES
};
