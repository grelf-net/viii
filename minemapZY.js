// Part of The Forest
// Copyright (c) Graham Relf, UK, 2021
// www.grelf.net
'use strict';

function MineMap (screen, observer, scale, stepSize)
{// this.centre = {x:0xfffffff0 & Math.round (observer.x), y:0xfffffff0 & Math.round (observer.y)};
  let meg = forest.mine.getGridXY (observer.x, observer.y);//ZY
  this.centre = {x:meg.xg, y:meg.yg};//ZY
  this.scale = scale;
  this.step = 0xfffffff0 & stepSize;
  this.g2 = screen.g2;
  this.wd = screen.wd;
  this.wd2 = this.wd / 2;
  this.ht = screen.ht;
  this.ht2 = this.ht / 2;
}

MineMap.prototype.mapPt = function (pt) { return { x: pt.x - this.x0, y: this.y0 - pt.y }; };

MineMap.prototype.draw = function ()
{ var t0 = new Date ().getTime (); // ms
  var fm = forest.mine, g2 = forest.screen.g2;
//  this.x0 = 0xfffffff0 & Math.round (this.centre.x - this.wd2);
//  this.y0 = 0xfffffff0 & Math.round (this.centre.y + this.ht2);
  var x0y0g = fm.getGridXY (this.centre.x - this.wd2, this.centre.y + this.ht2);//ZY
  this.x0 = x0y0g.xg;//ZY
  this.y0 = x0y0g.yg;//ZY
  g2.fillStyle = "#000";
  g2.fillRect (0, 0, this.wd, this.ht);
  var x, y, xs, ys, fill;
  for (ys = 0, y = this.y0; ys < this.ht; ys += 16, y -= 16)
  { for (xs = 0, x = this.x0; xs < this.wd; xs += 16, x += 16)
    { if (fm.isOpen (x, y))
      { if (fm.isOpen (x + 16, y) || fm.isOpen (x - 16, y)
         || fm.isOpen (x, y + 16) || fm.isOpen (x, y - 16))
        { fill = (fm.isOpenAbove (x, y))  ? "#fa0" : "#fff";
          this.plotCave (g2, xs, ys, fill);
  } } } }
  this.plotObserver (forest.observer, '#f00');
  var dt = new Date ().getTime () - t0; // ms
  forest.infoDiv.innerHTML = "Map centre: x = " + Math.round (this.centre.x) + 
    ", y = " + Math.round (this.centre.y) + " Drawn in " + dt + "ms";
};

MineMap.prototype.plotCave = function (g2, xs, ys, fill)
{ g2.fillStyle = fill;
  g2.fillRect (xs, ys, 16, 16);
  g2.strokeStyle = '#ddd';
  g2.strokeRect (xs, ys, 16, 16);
};

MineMap.prototype.changeScroll = function ()
{ var el = document.getElementById ("mapscroll");
  this.step = parseInt (el.options [el.selectedIndex].value);
//ZZ this.draw ();
//ZZ  this.setButtons ();
};

MineMap.prototype.moveDown = function ()
{ this.centre.y -= this.step;
  this.draw ();
};

MineMap.prototype.moveLeft = function ()
{ this.centre.x -= this.step; 
  this.draw ();
};

MineMap.prototype.moveRight = function ()
{ this.centre.x += this.step;
  this.draw ();
};

MineMap.prototype.moveUp = function ()
{ this.centre.y += this.step; 
  this.draw ();
};

MineMap.prototype.getScreenXY = function (x, y)
{ // Given ground coordinates
  return {x:x - this.x0, y:this.y0 - y};
};

MineMap.prototype.getGroundXY = function (sx, sy)
{ // Given screen coordinates
  return new Point (sx + this.x0, this.y0 - sy);
};

MineMap.prototype.plotObserver = function (observer, cssColour)
{ var sxy = this.getScreenXY (observer.x, observer.y);
  sxy.x += forest.mine.GRID2;//ZY
  sxy.y += forest.mine.GRID2;//ZY
  this.g2.strokeStyle = cssColour;
  this.g2.fillStyle = cssColour;
  this.g2.beginPath ();
  this.g2.arc (sxy.x, sxy.y, 10, 0, TWO_PI, true);
  this.g2.closePath ();
  this.g2.stroke ();
  var b0 = ((observer.b - 90) % 360), b0rad = b0 * DEG2RAD;
  var cosb0 = Math.cos (b0rad), sinb0 = Math.sin (b0rad);
  var bp45 = ((b0 + 45) % 360) * DEG2RAD;
  var bm45 = ((b0 - 45) % 360) * DEG2RAD;
  this.g2.beginPath ();
  this.g2.moveTo (sxy.x + 15 * cosb0, sxy.y + 15 * sinb0);
  this.g2.lineTo (sxy.x + 10 * Math.cos (bp45), sxy.y + 10 * Math.sin (bp45));
  this.g2.lineTo (sxy.x + 10 * Math.cos (bm45), sxy.y + 10 * Math.sin (bm45));
  this.g2.lineTo (sxy.x + 15 * cosb0, sxy.y + 15 * sinb0);
  this.g2.closePath ();
  this.g2.fill ();
};

MineMap.prototype.recentre = function (observer)
{ this.centre = {x: Math.round (observer.x), y: Math.round (observer.y)};
  this.draw ();
};

MineMap.prototype.setButtons = function () { showButtons (mineMapButtons); };
