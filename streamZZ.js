// Part of The Forest
// Copyright (c) Graham Relf, UK, 2018
// www.grelf.net
'use strict';
Stream.prototype.RANGE = 5;
Stream.prototype.MIN_STREAM_LENGTH = 10;
Stream.prototype.MARSHES = {};//ZZ
Stream.prototype.putMarsh = function (x, y) { Stream.prototype.MARSHES [x +',' + y] = 1; };//ZZ
Stream.prototype.isMarsh = function (x, y) { return (undefined !== Stream.prototype.MARSHES [x +',' + y]); };//ZZ

function Stream (fromX, fromY)
{ var pt = new Point (fromX, fromY);
  this.route = new Array ();
  this.route [0] = pt;
  var tr = forest.terrain;
  var ht0 = tr.terra (pt.x, pt.y).height;
  var flowing = true;
  while (flowing)
  { var htMin = ht0, xMin = pt.x, yMin = pt.y;
    for (var ix = pt.x - this.RANGE; ix <= pt.x + this.RANGE; ix++)
    { for (var iy = pt.y - this.RANGE; iy <= pt.y + this.RANGE; iy++)
      { if (ix !== pt.x && iy !== pt.y)
        { var ht = tr.terra (ix, iy).height;
          if (ht < htMin) { htMin = ht; xMin = ix; yMin = iy; }
    } } }
    if (htMin < ht0) 
    { //if (tr.atPlace (xMin, yMin) === TERRAINS.STREAM) { flowing = false; this.lakeEnd = false; } // join
      pt = new Point (xMin, yMin);
      this.route.push (pt); 
      if (htMin <= tr.lakeHt) { flowing = false; this.lakeEnd = true; }
      else ht0 = htMin;
    }
    else 
    { flowing = false;
      this.lakeEnd = false;
      if (this.route.length > this.MIN_STREAM_LENGTH)//ZZ
      { var tt = tr.terra (pt.x, pt.y).terrain;//ZZ
        if (tt === TERRAINS.TOWN || tt === TERRAINS.ROAD) return;//ZZ
        this.marshEnd = true;//ZZ
        for (ix = pt.x - 4; ix <= pt.x + 4; ix++)//ZZ
        { for (iy = pt.y - 4; iy <= pt.y + 4; iy++) Stream.prototype.putMarsh (ix, iy);//ZZ
} } } } }

Stream.prototype.draw = function (g2)
{ if (this.route.length > this.MIN_STREAM_LENGTH)
  { var fm = forest.map;
    g2.strokeStyle = fm.cssBLUE;
    var pt = this.route [1], prevPt = pt;
    var mapPt = fm.mapPt (pt);
    g2.moveTo (mapPt.x, mapPt.y);
    for (var i = 2; i < this.route.length; i++)
    { pt = this.route [i];
      mapPt = fm.mapPt (pt); 
      g2.lineTo (mapPt.x, mapPt.y);
      soakLine (prevPt.x, prevPt.y, pt.x, pt.y);
      prevPt = pt;
    }
    g2.stroke ();
    if (this.marshEnd) fm.plotMarsh (mapPt.x, mapPt.y);
} };

function soakLine (x0, y0, x1, y1)
{ var dx = x1 - x0, dy = y1 - y0;
  var d = Math.sqrt (dx * dx + dy * dy);
  dx = dx / d; dy = dy / d;
  var x = x0, y = y0;
  for (var i = 0; i <= d; i++)
  { soak (Math.round (x), Math.round (y), 1);
    x += dx; y += dy;
} }

function soak (x, y, halfWd)
{ var ft = forest.terrain;
  for (var iy = y - halfWd; iy <= y + halfWd; iy++)
  { for (var ix = x - halfWd; ix <= x + halfWd; ix++)
    { if (ft.terra (ix, iy).terrain !== TERRAINS.TOWN)
      { var pd = ft.atPlace (ix, iy);
        if (pd !== TERRAINS.ROAD) ft.place (ix, iy, TERRAINS.STREAM);//ZZ(if)
} } } }

function clearStreams ()
{ var ftp = forest.terrain.placed;
  for (var key in ftp)
  { if (ftp [key] === TERRAINS.STREAM) delete ftp [key]; }
}