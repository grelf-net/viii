// Part of The Forest
// Copyright (c) Graham Relf, UK, 2014-24
// www.grelf.net
'use strict';

function Point(x, y)
{ this.x = x;
  this.y = y;
}

Point.prototype.toString = function()
{ return "(" + this.x + ", " + this.y + ")";
};

Point.prototype.distance = function(otherPt)
{ var dx = this.x - otherPt.x;
  var dy = this.y - otherPt.y;
  return Math.sqrt(dx * dx + dy * dy);
};

Point.prototype.distanceAndBearing = function(otherPt)//RA
{ var dx = otherPt.x - this.x, dy = otherPt.y - this.y;
  var distance = Math.sqrt(dx * dx + dy * dy);
  var bearingRad = Math.atan2(dx, dy);//clockwise from north
  return {d:distance, b:bearingRad};
};

Point.prototype.zoom = function(scale)//From screen centre
{ var fs = forest.screen;
  var wd2 = fs.wd / 2, ht2 = fs.ht / 2;
  return new Point((this.x - wd2) * scale + wd2, (this.y - ht2) * scale + ht2);
};