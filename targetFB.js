// Part of The Forest
// Copyright (c) Graham Relf, UK, 2023
// www.grelf.net
'use strict';

// For pushing onto forest.targets[]. TL = Top Left
function Target (xTL, yTL, wd, ht, actFunction)
{ this.x = xTL;
  this.y = yTL;
  this.wd = wd;
  this.ht = ht;
  this.act = actFunction;// See handleClick() in forest.js
}

Target.prototype.contains = function (pt)
{ return (pt.x >= this.x && pt.x <= this.x + this.wd
         && pt.y >= this.y && pt.y <= this.y + this.ht);
};