// Part of The Forest
// Copyright (c) Graham Relf, UK, 2014-24
// www.grelf.net
'use strict';

function Mine()
{ this.GRID = 16; // metres
  this.GRID2 = this.GRID / 2;
  this.NOTGR = ~0xf;
  this.RANGE_G = 8; // Max no of cells visible in any direction
  this.RANGE_M = this.GRID * this.RANGE_G; // Metres
  var fc = forest.scene;
  this.FF = fc.FF;
  this.imWall = fc.imWall;
  this.gravel = fc.gravel;
  this.ht11 = 6600;// this.imWall.height * 11; may not yet be loaded
  this.wallHt = 9.375;// this.imWall.height / 64;
  this.light = loadImage("light.png");
  this.up = loadImage("up.png");
  this.imRgbMeter = loadImage("rgbmeter.png");
  this.imHeliMeter = loadImage("helimeter.png");
  this.imMetalDet = loadImage("metaldetector_300x200.png");
  this.imPhone = loadImage("phonebutton.png");
this.rgbMessage =
["You have found a very",
"useful measuring device.", "",
"Now you can really get",
"into things."];
this.heliMessage =
["This is a clever device.", "",
"Now you can see where",
"aircraft are parked.",
"Useful for pilots."];
this.metalMessage =
["You have found something",
"rather useful for finding",
"pieces of something.", "",
"Some people will have",
"tools to dig its results"];
this.phoneMessage =
["Now you have an extra button.", "",
"It seems to work by MAGIC"
];
  this.doFog = false; // Until after first draw
  this.noteState = 0;
  this.workarea = forest.workarea;
  var fs = forest.screen;
  this.ht = fs.ht;
  this.htBase = Math.floor(this.ht * 0.6);
  this.wd = fs.wd;
  this.wd2 = fs.wd / 2;
  this.ladderPt = null;
  this.flooded = false;
}

Mine.prototype.getGridXY = function(x, y)
{ return {xg: this.GRID * Math.round(x / this.GRID), yg: this.GRID * Math.round(y / this.GRID)}; };

// 1 level so open iff mineshaft on ground
Mine.prototype.isOpenAbove = function(xg, yg)
{ for (var ix = xg - this.GRID2; ix < xg + this.GRID2; ix++)
  { for (var iy = yg - this.GRID2; iy < yg + this.GRID2; iy++)
    { if (forest.terrain.terra(ix, iy).feature === FEATURES.MINE) return true;        
  } }
  return false;
};

// Mine open here? Must be if mineshaft on the ground
Mine.prototype.isOpen = function(xg, yg)
{ if (this.isOpenAbove(xg, yg)) return true;
  var u = PI10000 * Math.sin(xg) * Math.cos(yg);
  return (u - Math.floor(u)) > 0.5;
};

Mine.prototype.findCellsInRange = function()
{ var me = forest.observer, R = this.RANGE_M, G = this.GRID;
  var meg = this.getGridXY(me.x, me.y);
  this.cells = [];
  for (var yg = meg.yg - R; yg <= meg.yg + R; yg += G)
  { var dy = yg - me.y, dy2 = dy * dy;
    for (var xg = meg.xg - R; xg <= meg.xg + R; xg += G)
    { var dx = xg - me.x, d = Math.sqrt(dx * dx + dy2);
      if (d < R)
      { var db = Math.atan2(dx, dy) * RAD2DEG - me.b;
        if (db < -180) db += 360; else if (db > 180) db -= 360;
var G2 = this.GRID / 2;
var xNW = xg - G2, yNW = yg + G2, sxydNW = this.getScreenXYD(xNW, yNW, 0, me);
var xNE = xg + G2, yNE = yg + G2, sxydNE = this.getScreenXYD(xNE, yNE, 0, me);
var xSW = xg - G2, ySW = yg - G2, sxydSW = this.getScreenXYD(xSW, ySW, 0, me);
var xSE = xg + G2, ySE = yg - G2, sxydSE = this.getScreenXYD(xSE, ySE, 0, me);
if (Math.round(sxydNW.db) <= 45
 || Math.round(sxydNE.db) <= 45
 || Math.round(sxydSW.db) <= 45
 || Math.round(sxydSE.db) <= 45)
{ var fogNo = 0, dNr = d / R; 
  if (dNr > 0.5) fogNo = (dNr - 0.5) * 2; // 0..1
  this.cells.push({xg:xg, yg:yg, d:d, db:db, solid:!this.isOpen(xg, yg), fogNo:fogNo,
    sxydNW:sxydNW, sxydNE:sxydNE, sxydSW:sxydSW, sxydSE:sxydSE });
} } } }
  this.cells.sort(function(a, b) {return b.d - a.d;}); // Descending distance
};

Mine.prototype.draw = function ()
{ var time0 = new Date().getTime(); // ms
  forest.screen.canvas.title = "";
  this.ladderPt = null;
  this.msgNo = 0;
  this.drawLater = [];
  forest.targets = [];
  this.announceMeter = null;
  var fs = forest.screen, g2 = fs.g2;
  g2.fillStyle = '#000';
  g2.fillRect(0, 0, fs.wd, fs.ht);
  g2.font = "normal 32px serif";
  g2.fillStyle = "#70a";
  g2.fillText(forest.url, 8, 40);
  g2.drawImage(this.gravel, 0, this.htBase + 10, fs.wd, fs.ht - this.htBase - 10);
  this.findCellsInRange();
  var me = forest.observer;
  for (var ic = 0; ic < this.cells.length; ic++) // Furthest first
  { var cell = this.cells[ic];
    if (!cell.solid) this.drawFloor(g2, cell);
  }
  fs.im = g2.getImageData(0, 0, fs.wd, fs.ht);
  if (this.imWall.loaded) this.workarea.getImageData(this.imWall);
  for (ic = 0; ic < this.cells.length; ic++)
  { var cell = this.cells[ic];
    if (cell.solid)
    { var sxyds = [cell.sxydNW, cell.sxydNE, cell.sxydSW, cell.sxydSE];
      sxyds.sort(function(a, b) {return b.d - a.d;}); // Descending distance
      this.drawWall(sxyds [1], sxyds [3], cell.fogNo);
      this.drawWall(sxyds [2], sxyds [3], cell.fogNo);
    }
    if (this.isOpenAbove(cell.xg, cell.yg)) this.drawLadder(fs, cell, me);
  }
  fs.display();
  for (var i = 0; i < this.drawLater.length; i++)
  { var o = this.drawLater[i];
    g2.drawImage(o.im, o.x, o.y, o.w, o.h);  
    if (o.im === this.imRgbMeter)//FB:
    { forest.targets.push(
new Target(o.x, o.y, o.w, o.h, 
  function() 
  { me.rgbMeter = new RgbMeter();
    message(forest.mine.rgbMessage, true);            
  }));
    }
    else if (o.im === this.imHeliMeter)
    { forest.targets.push(
new Target(o.x, o.y, o.w, o.h,
  function() 
  { me.heliMeter = new HeliMeter();
    message(forest.mine.heliMessage, true);
  }));
    }
    else if (o.im === this.imMetalDet)
    { forest.targets.push(
new Target(o.x, o.y, o.w, o.h,
  function() 
  { me.metalDet = new MetalDetector();
    message(forest.mine.metalMessage, true);
  }));
    }
    else if (o.im === this.imPhone)
    { forest.targets.push(
new Target(o.x, o.y, o.w, o.h,
  function() 
  { if (!me.phoneButton)//only once!
    { let ps =
{ kind:"extra",id:"phone",text:"Phone box",key:"?",alt:"/",func:nearestPhone,roles:"m" };
      sceneButtons.push(ps);
      mapButtons.push(ps);
    }
    me.phoneButton = true;
    message(forest.mine.phoneMessage, true);
  }));
    }
    else if (o.im === forest.scene.cone01)
    { forest.targets.push(
        new Target(o.x, o.y, o.w, o.h, function () { message("Just a cone", true); }));
  } }//:FB
  this.setButtons();
  me.drawCompass();
  this.doFog = true;
  var dt = new Date().getTime() - time0; // ms
  forest.infoDiv.innerHTML = me.toString() + ", Drawn in " + dt + "ms";
  if (null !== this.announceMeter) message(this.announceMeter, true);
};

Mine.prototype.getScreenXYD = function(x, y, z, me)
{ var dx = x - me.x, dy = y - me.y, d = Math.sqrt(dx * dx + dy * dy);
  var db = Math.atan2(dx, dy) * RAD2DEG - me.b;
  if (db < -180) db += 360; else if (db > 180) db -= 360;
  var dbRad = db * DEG2RAD, sinb = Math.sin(dbRad), cosb = Math.cos(dbRad);
  var zz = d * cosb;
if (zz < 1) zz = 1;
  var fRatio = this.FF / zz;
  var sx = fRatio * d * sinb + this.wd2; // Relative to screen centre, wd2
  var sy = this.htBase + fRatio * (me.ME_HT - z);
  return {x:sx, y:sy, d:d, db:db, x0:x, y0:y};
};

Mine.prototype.drawWall = function(sxyd1, sxyd2, fogNo)
{ if (Math.abs (sxyd1.db) >= 90 && Math.abs (sxyd2.db) >= 90) return; // All offscreen
  var base1 = sxyd1, base2 = sxyd2, base3, top1, top2, top3;
  if (base1.db > base2.db) { base1 = sxyd2; base2 = sxyd1; } // base1 smaller db
  // Avoid cos(db) close to 0:
  if (Math.abs (base1.db + 90) < 0.1) base1.db = -90.1;
  else if (Math.abs (base1.db - 90) < 0.1) base1.db = 90.1;
  if (Math.abs (base2.db + 90) < 0.1) base2.db = -90.1;
  else if (Math.abs (base2.db - 90) < 0.1) base2.db = 90.1;
  var state = 0, dx, dy, d12, s1, s2, frac, x3, y3, tmp;
  if (base2.db < 45 && base1.db < base2.db - 180)
  { state = 1; tmp = base1; base1 = base2; base2 = tmp; } 
  else if (base1.db > -45 && base2.db > base1.db + 180)
  { state = 2; tmp = base1; base1 = base2; base2 = tmp; }
  else if (base1.db < 45 && base2.db > 90) state = 3;
  else if (base2.db > -45 && base1.db < -90) state = 4;
  switch (state)
  {
case 0: // All on screen
    top1 = this.getScreenXYD (base1.x0, base1.y0, this.wallHt, forest.observer);
    top2 = this.getScreenXYD (base2.x0, base2.y0, this.wallHt, forest.observer);
    this.skewHoriz (fogNo, this.imWall, top1, base1, top2, base2, 0, this.imWall.width);
    this.perhapsHideObj (base1, base2);
    break;
case 1:// Part offscreen right
case 3:
    dx = base2.x0 - base1.x0; dy = base2.y0 - base1.y0;
    d12 = Math.sqrt (dx * dx + dy * dy);
    s1 = Math.sin ((60 - base1.db) * DEG2RAD); s2 = Math.sin ((base2.db - 60) * DEG2RAD);
    var d13 = d12 * s1 * base1.d / (s1 * base1.d + s2 * base2.d);
    frac = d13 / d12;
    x3 = base1.x0 + frac * dx; y3 = base1.y0 + frac * dy;
    base3 = this.getScreenXYD (x3, y3, 0, forest.observer);
    top1 = this.getScreenXYD (base1.x0, base1.y0, this.wallHt, forest.observer);
    top3 = this.getScreenXYD (base3.x0, base3.y0, this.wallHt, forest.observer);
    this.skewHoriz (fogNo, this.imWall, top1, base1, top3, base3, 0, frac * this.imWall.width);
    this.perhapsHideObj (base1, base3);
    break;
case 2:  // Part offscreen left
case 4:
    dx = base2.x0 - base1.x0; dy = base2.y0 - base1.y0;
    d12 = Math.sqrt (dx * dx + dy * dy);
    s1 = Math.sin ((60 + base2.db) * DEG2RAD); s2 = Math.sin ((-base1.db - 60) * DEG2RAD);
    var d23 = d12 * s1 * base2.d / (s2 * base1.d + s1 * base2.d);
    frac = d23 / d12;
    x3 = base2.x0 - frac * dx; y3 = base2.y0 - frac * dy;
    base3 = this.getScreenXYD (x3, y3, 0, forest.observer);
    top2 = this.getScreenXYD (base2.x0, base2.y0, this.wallHt, forest.observer);
    top3 = this.getScreenXYD (base3.x0, base3.y0, this.wallHt, forest.observer);
    this.skewHoriz (fogNo, this.imWall, top3, base3, top2, base2,
      (1 - frac) * this.imWall.width, this.imWall.width - 1);
    this.perhapsHideObj (base3, base2);
    break;
  }
};

Mine.prototype.perhapsHideObj = function (baseL, baseR)
{ for (var i = 0; i < this.drawLater.length; i++)
  { var o = this.drawLater [i]; // Hidden by wall?
    if ((baseL.d < o.d || baseR.d < o.d) && baseL.x < (o.x + o.w) && baseR.x > o.x) 
      this.drawLater.splice (i, 1);
  }
};

Mine.prototype.drawLadder = function (fs, cell, me)
{ this.ladderPt = new Point (cell.xg - 6, cell.yg - 6); // SW corner
  var lSxyd = this.getScreenXYD (this.ladderPt.x, this.ladderPt.y, 0, me);
  var fogNo = 1, dNr = lSxyd.d / this.RANGE_M; 
  if (dNr > 0.5) fogNo = 1 - (dNr - 0.5) * 2; // 1..0
  var ladderPx = [Math.round (255 * fogNo), Math.round (200 * fogNo), Math.round (60 * fogNo), 255];
  var scale = 10 / lSxyd.d;
  var lineWd = (scale < 0.25) ? 1 : 4 * scale;
  var halfWd = 40 * scale, stepHt = halfWd;
  if (Math.abs (lSxyd.db) < 60 && lSxyd.x - halfWd >= 0 && lSxyd.x + halfWd + lineWd < fs.wd)
  { var ix, iy, iw;
    var yTop = lSxyd.y - this.ht11 / lSxyd.d;
    for (iy = yTop; iy < lSxyd.y; iy++)
    { for (iw = 0; iw <= lineWd; iw++)
      { fs.setPixel (lSxyd.x - halfWd + iw, iy, ladderPx);
        fs.setPixel (lSxyd.x + halfWd - iw, iy, ladderPx);
    } }
    for (iy = lSxyd.y - stepHt; iy > yTop; iy -= stepHt)
    { for (iw = 0; iw <= lineWd; iw++)
      { for (ix = lSxyd.x - halfWd; ix <= lSxyd.x + halfWd; ix++)
        { fs.setPixel (ix, iy + iw, ladderPx); }
    } }
    if (this.up.loaded)
    { var w = this.up.width * scale, h = this.up.height * scale;
      this.drawLater.push ({d:cell.d, im:this.up, x:lSxyd.x - w * 0.5, y:yTop - h * 0.25, w:w, h:h});
  } }
};

Mine.prototype.drawFloor = function (g2, cell)
{ g2.fillStyle = '#555';
  g2.strokeStyle = '#000';
  var me = forest.observer;
  var sxydC = this.getScreenXYD (cell.xg, cell.yg, 0, me);
  var sxydE = this.getScreenXYD (cell.xg + 8, cell.yg, 0, me);
  var sxydS = this.getScreenXYD (cell.xg, cell.yg - 8, 0, me);
  var sxydW = this.getScreenXYD (cell.xg - 8, cell.yg, 0, me);
  var sxydN = this.getScreenXYD (cell.xg, cell.yg + 8, 0, me);
  this.drawTile (g2, cell.sxydNE, sxydE, sxydC, sxydN);
  this.drawTile (g2, cell.sxydSE, sxydS, sxydC, sxydE);
  this.drawTile (g2, cell.sxydSW, sxydW, sxydC, sxydS);
  this.drawTile (g2, cell.sxydNW, sxydN, sxydC, sxydW);
  if (Math.abs (cell.db) < 50 && this.light.loaded && cell.d > 8)
  { var scale = 10 / cell.d, w = this.light.width * scale, h = this.light.height * scale;
    var sxyd = this.getScreenXYD (cell.xg, cell.yg, 0, forest.observer);
    g2.drawImage (this.light, sxyd.x - w * 0.5, sxyd.y - this.ht11 / cell.d, w, h);
    let ufe = (PI10000 * cell.xg * cell.yg) & 0xfe;
if (ufe >= 6 && ufe <= 12)//RA
{ let cn = forest.scene.cone01;
  if (cn.loaded)
  { w = cn.width * scale; h = cn.height * scale;
    let cnx = sxyd.x - w * 0.5, cny = sxyd.y - h;
    this.drawLater.push({d:cell.d, im:cn, x:cnx, y:cny, w:w, h:h});
} }
else if (ufe > 20 && ufe < 30)//RA
{ if (undefined === me.rgbMeter)
  { let m = this.imRgbMeter;
    if (m.loaded)
    { w = m.width * scale; h = m.height * scale;
      this.drawLater.push({d:cell.d, im:m, x:sxyd.x - w * 0.5, y:sxyd.y - h, w:w, h:h});
      if (cell.d < 16)
      { me.rgbMeter = new RgbMeter();
        this.announceMeter = this.rgbMessage;
} } } }
else if (ufe > 40 && ufe < 50)//RA       - scope for a new function here
{ if (undefined === me.heliMeter)
  { let m = this.imHeliMeter;
    if (m.loaded)
    { w = m.width * scale; h = m.height * scale;
      this.drawLater.push({d:cell.d, im:m, x:sxyd.x - w * 0.5, y:sxyd.y - h, w:w, h:h});
      if (cell.d < 16)
      { me.heliMeter = new HeliMeter();
        this.announceMeter = this.heliMessage;
} } } }
else if (ufe > 60 && ufe < 70)//RA
{ if (undefined === me.metalDet)
  { let m = this.imMetalDet;
    if (m.loaded)
    { w = m.width * scale; h = m.height * scale;
      this.drawLater.push({d:cell.d, im:m, x:sxyd.x - w * 0.5, y:sxyd.y - h, w:w, h:h});
      if (cell.d < 16)
      { me.metalDet = new MetalDetector();
        this.announceMeter = this.metalMessage;
} } } }
else if (ufe > 80 && ufe < 90)//RA
{ if (!me.phoneButton)
  { let m = this.imPhone;
    if (m.loaded)
    { w = m.width * scale; h = m.height * scale;
      this.drawLater.push({d:cell.d, im:m, x:sxyd.x - w * 0.5, y:sxyd.y - h, w:w, h:h});
      if (cell.d < 16)
      { let ps =
{ kind:"extra",id:"phone",text:"Phone box",key:"?",alt:"/",func:nearestPhone,roles:"m" };
        sceneButtons.push(ps);
        mapButtons.push(ps);
        me.phoneButton = true;
        this.announceMeter = this.phoneMessage;
} } } }
  }
};

Mine.prototype.drawTile = function (g2, p1, p2, p3, p4)
{ g2.beginPath ();
  g2.moveTo (p1.x, p1.y);
  g2.lineTo (p2.x, p2.y);
  g2.lineTo (p3.x, p3.y);
  g2.lineTo (p4.x, p4.y);
  g2.closePath ();
  g2.stroke ();
};

Mine.prototype.skewHoriz = function (fogNo, im, tL, bL, tR, bR, srcMinX, srcMaxX)
{ if (0 === fogNo || !this.doFog) skewHoriz (im, tL, bL, tR, bR, srcMinX, srcMaxX);
  else
  { var fogged, iFogNo = Math.round (fogNo * 7);
    if (undefined === im.foggy [iFogNo]) // Fogged version not yet created, create it now:
    { var cnv = document.createElement ('canvas');
      cnv.width = im.width;
      cnv.height = im.height;
      var g2 = cnv.getContext ('2d');
      g2.drawImage (im, 0, 0); // Full size
      var imData = g2.getImageData (0, 0, im.width, im.height);
      var px = imData.data;
      for (var i = 0; i < px.length; i++)
      { var i3 = i + 3;
        if (0 === px [i3]) i = i3; // skip transparent px
        else
        { px [i] -= px [i] * fogNo; i++;
          px [i] -= px [i] * fogNo; i++;
          px [i] -= px [i] * fogNo; i++;
      } } // loop inc skips alpha
      g2.putImageData (imData, 0, 0);
      fogged = new Image ();
      fogged.onload = function () { fogged.loaded = true; forest.workarea.getImageData (fogged); };
      fogged.src = cnv.toDataURL ('image/png'); // Get result as an Image
      im.foggy [iFogNo] = fogged;
    } // Do not draw - may take time to load. It'll be missing from scene for now
    else
    { fogged = im.foggy [iFogNo];
      if (fogged.loaded) skewHoriz (fogged, tL, bL, tR, bR, srcMinX, srcMaxX);
  } }
};

Mine.prototype.lookUp = function () { if (this.htBase < this.ht) { this.htBase += 50; this.draw (); };}
Mine.prototype.lookLevel = function (){ this.htBase = Math.floor (this.ht * 0.6); this.draw (); };
Mine.prototype.lookDown = function () { if (this.htBase > 0) { this.htBase -= 50; this.draw (); } };

Mine.prototype.setButtons = function ()
{ if (forest.needOK) return;
  showButtons(mineButtons);
};

function enterMine(fromGround)
{ var fm = forest.mine, me = forest.observer;
  if (null !== forest.fwdTimerId) { clearTimeout(forest.fwdTimerId); forest.fwdTimerId = null; }
  var meg = fm.getGridXY(me.x, me.y);
  if (!fm.isOpen(meg.xg, meg.yg)) { meg.xg += 16; }
  if (!fm.isOpen(meg.xg, meg.yg)) { meg.yg += 16; } 
  if (!fm.isOpen(meg.xg, meg.yg)) { meg.xg -= 32; }
  if (!fm.isOpen(meg.xg, meg.yg)) { meg.yg -= 32; } 
  me.x = meg.xg; me.y = meg.yg;
  if (me.b < 0) me.b += 360;
  forest.showing = "mine";
  me.inMine = true;
  forest.mineMap.centre = {x: Math.round(me.x), y: Math.round(me.y)};
  if (fromGround)
  { fm.setButtons();
    fm.y = 0; fm.dy = 10;
    requestAnimationFrame(stepDown);
  }
  else // from URL ?mine=y
  { forest.mineMap.setButtons();
    forest.mineMap.draw();
} }

Mine.prototype.forward = function()
{ var me = forest.observer, st = me.stride;
  var testX = me.x + st * me.sinb, testY = me.y + st * me.cosb;
  if (!this.rockWithinR(testX, testY, 1)) // reduces artefacts
  { me.x = testX; me.y = testY;
    if (null !== this.ladderPt && this.ladderPt.distance(new Point (me.x, me.y)) < 4)
    { this.y = 0; stepUp(); }
    else this.draw(); 
  }
  else message("You cannot go through solid rock!");
};

Mine.prototype.rockWithinR = function(x, y, r)
{ for (var ix = x - r; ix <= x + r; ix++)
  { for (var iy = y - r; iy <= y + r; iy++)
    { var meg = this.getGridXY(ix, iy);
      if (!this.isOpen(meg.xg, meg.yg)) return true;
  } }
  return false;
};

function stepDown()
{ var fm = forest.mine, fs = forest.screen, g2 = fs.g2;
  if (fm.y < fs.ht)
  { var hty = fs.ht - fm.y;
    var imData = g2.getImageData(0, fm.y, fs.wd, hty);
    g2.putImageData(imData, 0, 0);
    g2.drawImage(fm.imWall, 0, hty);
    fm.y += fm.dy;
    requestAnimationFrame(stepDown);
  }
  else if (fm.flooded)
  { message("SPLOSH  GLUG  GLUG");
    setTimeout(init, 5000); // restart
  }
  else fm.draw();
}

function stepUp()
{ let fm = forest.mine, fs = forest.screen, g2 = fs.g2;
  if (fm.y < fs.ht)
  { g2.fillStyle = "#adf";
    g2.fillRect(0, 0, fs.wd, fm.y);
    g2.drawImage(fm.imWall, 0, fm.y);
    fm.y += fm.dy;
    requestAnimationFrame(stepUp);
  }
  else
  { let me = forest.observer;
    me.inMine = false;//Step away from mine:
    let xy = forest.terrain.findGoodSitePart2(me.x, me.y, false);
    me.x = xy.x; me.y = xy.y;
    toScene(); 
} }