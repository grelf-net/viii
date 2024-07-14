// Part of The Forest
// Copyright (c) Graham Relf, UK, 2018
// www.grelf.net
'use strict';

function ScenePoint (distance, bearing, x, y, odd)
{ this.d = distance;
  this.b = bearing;
  this.x = x;
  this.y = y;
  this.o = odd;//ES:
  this.fogNo = 0;
  this.tr = undefined;
  this.building = undefined;
  this.drawn = undefined;
  this.clear = undefined;//:ES
}

// In order of descending distance
ScenePoint.prototype.sort = function (a, b)
{ if (a.d > b.d) return -1;
  if (a.d < b.d) return 1;
  return 0;
};

ScenePoint.prototype.toString = function ()
{ return "d = " + this.d + " b = " + this.b + " x = " + this.x + " y = " + this.y + " o = " + this.o; };

ScenePoint.prototype.getTerra = function ()
{ if (this.tr === undefined) this.tr = forest.terrain.terra (this.x, this.y);
  return this.tr;
};