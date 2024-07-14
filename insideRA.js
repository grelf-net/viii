// Part of The Forest
// Copyright (c) Graham Relf, UK, 2018-24
// www.grelf.net
'use strict';

function loadInsidePics()
{ Inside.prototype.pics = makeNotices();
  Inside.prototype.upButton = loadImage('liftup.png');
  Inside.prototype.control = loadImage('controlpanel.png');
  Inside.prototype.imTexts =
  [loadImText('204'), loadImText('194'), loadImText('183'), loadImText('173'),
   loadImText('164'), loadImText('155'), loadImText('144'), loadImText('134'),
   loadImText('125'), loadImText('113'), loadImText('104'), loadImText('094'),
   loadImText('084'), loadImText('074'), loadImText('065'), loadImText('054'),
   loadImText('041'), loadImText('031')];
}

function loadImText(s) { return { im: loadImage('Lake_' + s + '.png'), text: s }; }

function stepInside()
{ var me = forest.observer;
  var bg = me.building;
  if (null === bg) alert("ERROR: Lost building");
  else 
  { me.x += 4 * me.sinb;
    me.y += 4 * me.cosb;
    if (me.x < bg.xW + 1) me.x = bg.xW + 1;
    else if (me.x > bg.xE - 1) me.x = bg.xE - 1;
    if (me.y < bg.yS + 1) me.y = bg.yS + 1;
    else if (me.y > bg.yN - 1) me.y = bg.yN - 1;
    me.inside = new Inside(bg);
    me.inside.draw(); 
    me.building = null;
} }

const UPPER_LEVEL = 9;

function Inside(b) // b is a Building
{ this.BWD = Building.prototype.WIDTH;
  this.FF = forest.scene.FF;
  this.YSCALE = forest.scene.YSCALE;
  this.FSCALE = forest.scene.FSCALE;
  var fs = forest.screen;
  this.ht = fs.ht;
  this.htBase = Math.floor(this.ht * 0.6);
  this.wd = fs.wd;
  this.wd2 = this.wd / 2;
  this.g2 = fs.g2;
  this.g2.font = "bold 24px sans-serif";
  this.bht = b.ht;
  this.pixy = b.pixy;
  this.xC = b.xC; // Centre
  this.yC = b.yC;
  this.xE = b.xE;
  this.xW = b.xW;
  this.yS = b.yS;
  this.yN = b.yN;
  this.pix = PI10000 * b.xC;
  this.piy = PI10000 * b.yC;
  this.wallColour = [192 + (this.pix & 63), 192 + (this.piy & 63), 192 + (this.pixy & 63), 255];
  this.doorSide = b.doorSide;
  this.doorFill = '#fff';//ZZ was b.doorFill;
  this.doorL = new Point(b.spDoorL.x, b.spDoorL.y);
  this.doorR = new Point(b.spDoorR.x, b.spDoorR.y);
  this.ims = {};//ZZ:
  var npics = this.pics.length, ipic = Math.floor(this.pixy) % npics;
  this.ims["N"] = Inside.prototype.pics[ipic];
  this.ims["E"] = Inside.prototype.pics[(ipic + 1) % npics];
  this.ims["W"] = Inside.prototype.pics[(ipic + 2) % npics];
  this.ims["S"] = Inside.prototype.pics[(ipic + 3) % npics];//:ZZ
  this.ims[this.doorSide] = null;
  this.fa = forest.around;
  this.ahead = new Array(this.BWD * this.BWD);//ZY
  this.nAhead = 0;//ZY
  this.on = (b.doorFill === '#e7addc');//ZZ
  this.hasLift = (b.nStoreys > 1);//ZZ
  this.liftCalled = false;
  this.liftHt = UPPER_LEVEL;
  this.meHt = 0;
  this.workarea = new WorkArea(this.wd, this.ht);
  // Control panel:
  var cx = 100, cy = 50;
  this.controlXY = { x:cx, y:cy };
  this.refillBounds = { xL:cx + 65, xR:cx + 123, yT:cy + 94, yB:cy + 150};
  this.drainBounds = { xL:cx + 65, xR:cx + 123, yT:cy + 258, yB:cy + 316};
  this.mapTL = { x:cx + 170, y:cy + 53 };
  this.textBox = { x:cx + 50, y:cy + 186, w:85, h:36 };
  this.textTL = { x:cx + 65, y:cy + 210 };
  this.downBounds = { xL: cx + 502, xR: cx + 544, yT: cy + 354, yB: cy + 394 };
  this.pumping = false;
}

Inside.prototype.draw = function()
{ var t0 = new Date().getTime(); // ms
  var me = forest.observer;
  if (this.meHt === UPPER_LEVEL) // Prevent moving off the lift
  { me.x = this.xE - 1; me.y = this.yN - 1; }
  var x0 = me.x, y0 = me.y, b0 = me.b;
  this.fa.init(Math.round(me.x), Math.round(me.y));
  var xOdd = false;
  for (var x = this.xW; x <= this.xE; x++, xOdd = !xOdd)
  { var dx = x - x0, dx2 = dx * dx;
    var yOdd = false;
    for (var y = this.yS; y <= this.yN; y++, yOdd = !yOdd)
    { var sp, dy = y - y0;
      var d = Math.sqrt(dx2 + dy * dy);
      var b = Math.atan2(dx, dy) * RAD2DEG;
      var db = b - b0;
      if (db < -180) db += 360; else if (db > 180) db -= 360;
      this.fa.aroundSet(d, db, x, y, xOdd && yOdd);
      sp = this.fa.aroundGet(x, y);
      if (-70 <= db && db <= 70)
      { this.ahead[this.nAhead] = sp; this.nAhead++; }//ZY
  } }
  var fs = forest.screen;
  for (var x = 0; x < fs.wd; x++)
  { for (var y = 0; y < fs.ht; y++) fs.setPixel(x, y, this.wallColour); }
  if (this.hasLift) this.drawButton();//ZZ
  this.drawIm("N");
  this.drawIm("E");
  this.drawIm("W");
  this.drawIm("S");
  fs.display();
  this.g2.font = "normal 32px serif";
  this.g2.fillStyle = "#000";//ZZ was "#e5b900";
  this.g2.fillText(forest.url, 8, 40);
  for (var ii = 0; ii < this.nAhead; ii++)//QZ
  { sp = this.ahead[ii];//QZ
    x = sp.x; y = sp.y;
    if (x < this.xE && y < this.yN)
    { // Floor tile:
      var sxy0 = this.getScreenXY(x, y, 0);
      var sxy1 = this.getScreenXY(x + 1, y, 0);
      var sxy2 = this.getScreenXY(x + 1, y + 1, 0);
      var sxy3 = this.getScreenXY(x, y + 1, 0);
      this.g2.beginPath();
      this.g2.moveTo(sxy0.x, sxy0.y);
      this.g2.lineTo(sxy1.x, sxy1.y);
      this.g2.lineTo(sxy2.x, sxy2.y);
      this.g2.lineTo(sxy3.x, sxy3.y);
      this.g2.closePath();
      this.g2.fillStyle = (x + y) % 2 === 0  ? '#000' : '#fff'; 
      this.g2.fill();
      this.g2.strokeStyle = '#666';
      this.g2.stroke();
  } }
  this.drawCorner(this.xW, this.yN);
  this.drawCorner(this.xW, this.yS);
  this.drawCorner(this.xE, this.yN);
  this.drawCorner(this.xE, this.yS);
  this.drawDoor();
  this.drawWindows("N");
  this.drawWindows("E");
  this.drawWindows("S");
  this.drawWindows("W");
  if (this.hasLift) this.drawLift();//ZZ
  // Level markers:
  this.g2.strokeStyle = "#000";
  this.g2.beginPath();
  this.g2.moveTo(0, this.htBase);
  this.g2.lineTo(20, this.htBase);
  this.g2.stroke();
  this.g2.moveTo(this.wd - 1, this.htBase);
  this.g2.lineTo(this.wd - 21, this.htBase);
  this.g2.stroke();
  if (this.meHt === UPPER_LEVEL)
  { this.g2.drawImage(this.control, this.controlXY.x, this.controlXY.y);
    var imNo = 0;
    if (forest.terrain.lakeHt < forest.terrain.LAKE_HT0) imNo = 17;
    this.g2.drawImage(this.imTexts[imNo].im, this.mapTL.x, this.mapTL.y);
    this.g2.fillStyle = '#555';
    this.g2.font = "bold 24px sans-serif";
    this.g2.fillText(forest.terrain.lakeHt.toFixed(0) + "m", this.textTL.x, this.textTL.y);
  }
  me.dht = me.getHt10mAhead() - forest.terrain.terra(me.x, me.y).height;//ZZ
  var dt = new Date().getTime() - t0; // ms
  forest.infoDiv.innerHTML = me.toString() + ", Drawn in " + dt + "ms";
};

Inside.prototype.drawWindows = function(side)
{ var ptL, ptR, dd, sxy;
  switch (side)
  {
case "N": 
    ptL = { x:this.xW, y:this.yN };
    ptR = { x:this.xE, y:this.yN };
    dd = { dx:1, dy:0 };
    break;
case "E": 
    ptL = { x:this.xE, y:this.yN };
    ptR = { x:this.xE, y:this.yS };
    dd = { dx:0, dy:-1 };
    break;
case "S": 
    ptL = { x:this.xE, y:this.yS };
    ptR = { x:this.xW, y:this.yS };
    dd = { dx:-1, dy:0 };
    break;
case "W": 
    ptL = { x:this.xW, y:this.yS };
    ptR = { x:this.xW, y:this.yN };
    dd = { dx:0, dy:1 };
    break;
  }
  var spL = this.fa.aroundGet(ptL.x, ptL.y);
  var spR = this.fa.aroundGet(ptR.x, ptR.y);
  if (spR.b < -50 || spL.b > 50) return; // Wall out of view
  this.g2.fillStyle = '#eef';
  for (var i = 1; i < 12; i += 4)
  { var iddx = i * dd.dx, iddy = i * dd.dy, i2ddx = (i + 2) * dd.dx, i2ddy = (i + 2) * dd.dy;
    this.g2.beginPath();
    sxy = this.getScreenXY(ptL.x + iddx, ptL.y + iddy, 10);
    this.g2.moveTo(sxy.x, sxy.y);
    sxy = this.getScreenXY(ptL.x + iddx, ptL.y + iddy, 16);
    this.g2.lineTo(sxy.x, sxy.y);
    sxy = this.getScreenXY(ptL.x + i2ddx, ptL.y + i2ddy, 16);
    this.g2.lineTo(sxy.x, sxy.y);
    sxy = this.getScreenXY(ptL.x + i2ddx, ptL.y + i2ddy, 10);
    this.g2.lineTo(sxy.x, sxy.y);
    this.g2.closePath();
    this.g2.fill();
  }
};

Inside.prototype.drawCorner = function(x, y)
{ var db = this.fa.aroundGet(x, y).b;
  if (-70 <= db && db <= 70)
  { var sxy = this.getScreenXY(x, y, 0);
    this.g2.strokeStyle = '#555';
    this.g2.beginPath();
    this.g2.moveTo(sxy.x, sxy.y);
    this.g2.lineTo(sxy.x, 0);
    this.g2.stroke();
} };

Inside.prototype.drawDoor = function()
{ // Right/Left reversed inside
  var db = this.fa.aroundGet(this.doorR.x, this.doorR.y).b;
  if (-70 <= db && db <= 70)
  { var bL = this.getScreenXY(this.doorR.x, this.doorR.y, 0);
    var spL = this.fa.aroundGet(this.doorR.x, this.doorR.y);
    var fscaleL = this.FSCALE / spL.d;
    var htL = Building.prototype.DOOR_HT * fscaleL * 20;
    var bR = this.getScreenXY(this.doorL.x, this.doorL.y, 0);
    var spR = this.fa.aroundGet(this.doorL.x, this.doorL.y);
    var fscaleR = this.FSCALE / spR.d;
    var htR = Building.prototype.DOOR_HT * fscaleR * 20;
    this.g2.beginPath();
    this.g2.moveTo(bL.x, bL.y);
    this.g2.lineTo(bL.x, bL.y - htL);
    this.g2.lineTo(bR.x, bR.y - htR);
    this.g2.lineTo(bR.x, bR.y);
    this.g2.closePath();
    this.g2.fillStyle = this.doorFill;
    this.g2.strokeStyle = '#555';
    this.g2.fill();
    this.g2.stroke();
} };

Inside.prototype.drawIm = function(side)
{ var im = this.ims[side];
  if (undefined === im || null === im) return;
  if (!im.loaded) { message ("Image not yet loaded.", "There will be more to see soon."); return; }
  if (im.width <= 0 || im.height <= 0) { message ("image " + im.width + " x " + im.height); return; }
  this.workarea.getImageData(im);
  var x0, y0, z0 = 200; // Under im on wall
  var xL, yL, xR, yR; // Left/Right on wall
  switch (side)
  { // Under im on wall:
  case "N": x0 = this.xC; y0 = this.yN; xL = x0 - 2; xR = x0 + 2; yL = y0; yR = y0; break;
  case "E": x0 = this.xE; y0 = this.yC; xL = x0; xR = x0; yL = y0 + 2; yR = y0 - 2; break;
  case "S": x0 = this.xC; y0 = this.yS; xL = x0 + 2; xR = x0 - 2; yL = y0; yR = y0; break;
  case "W": x0 = this.xW; y0 = this.yC; xL = x0; xR = x0; yL = y0 - 2; yR = y0 + 2; break;
  }
  var spL = this.fa.aroundGet(xL, yL);
  var fscaleL = this.FSCALE / spL.d;
  var spR = this.fa.aroundGet (xR, yR);
  var fscaleR = this.FSCALE / spR.d;
  var sxyL = this.getScreenXY(xL, yL, 0);
  var sxyR = this.getScreenXY(xR, yR, 0);
  var tL = new Point(sxyL.x, sxyL.y - (z0 + 250) * fscaleL);
  var bL = new Point(sxyL.x, sxyL.y - (z0 * fscaleL));
  var tR = new Point(sxyR.x, sxyR.y - (z0 + 250) * fscaleR);
  var bR = new Point(sxyR.x, sxyR.y - (z0 * fscaleR));
  skewHoriz(im, tL, bL,tR, bR);
};

Inside.prototype.drawButton = function()
{ var im = this.upButton;
  if (undefined === im || null === im || !im.loaded) return;
  var wc = this.wallColour;
  this.workarea.g2.fillStyle = makeCssColour(wc[0], wc[1], wc[2]);
  this.workarea.g2.fillRect(0, 0, im.width, im.height);
  this.workarea.getImageData(im);
  // Left of E wall image:
  var x0 = this.xE, y0 = this.yC, z0 = 130;
  var xL = x0, yL = y0 + 5, xR = x0, yR = y0 + 4; // Left/Right on wall
  var spL = this.fa.aroundGet(xL, yL);
  var fscaleL = this.FSCALE / spL.d;
  var spR = this.fa.aroundGet(xR, yR);
  var fscaleR = this.FSCALE / spR.d;
  var sxyL = this.getScreenXY(xL, yL, 0);
  var sxyR = this.getScreenXY(xR, yR, 0);
  var tL = new Point(sxyL.x, sxyL.y - (z0 + 100) * fscaleL);
  var bL = new Point(sxyL.x, sxyL.y - (z0 * fscaleL));
  var tR = new Point(sxyR.x, sxyR.y - (z0 + 100) * fscaleR);
  var bR = new Point(sxyR.x, sxyR.y - (z0 * fscaleR));
  skewHoriz(im, tL, bL,tR, bR);
  this.upLiftBounds = { xL: tL.x, yT: Math.min (tL.y, tR.y), xR: tR.x, yB: Math.max (bL.y, bR.y)};
};

Inside.prototype.getScreenXY = function(x, y, ht)
{ var sp = this.fa.aroundGet(x, y);
  var brad = sp.b * DEG2RAD, sinb = Math.sin(brad), cosb = Math.cos(brad);
  var zz = sp.d * cosb;
if (zz < 1) zz = 1;
  var fRatio = this.FF / zz;
  var sx = fRatio * sp.d * sinb + this.wd2; // Relative to screen centre, wd2
  var sy = this.htBase - fRatio * (ht - forest.observer.ME_HT - this.meHt);
  return {x:sx, y:sy};
};

Inside.prototype.lookUp = function() { if (this.htBase < this.ht) { this.htBase += 50; this.draw(); } }
Inside.prototype.lookLevel = function(){ this.htBase = Math.floor (this.ht * 0.6); this.draw(); }
Inside.prototype.lookDown = function() { if (this.htBase > 0) { this.htBase -= 50; this.draw(); } }

Inside.prototype.checkAndDraw = function()
{ var me = forest.observer, leaving = false;
  switch (this.doorSide)
  {
  case 'N':
    if (me.y >= this.yN && me.x >= this.xC - 4 && me.x <= this.xC + 4)
    { me.y = this.yN + 1; leaving = true; }//ZZ
    break;
  case 'S':
    if (me.y <= this.yS && me.x >= this.xC - 4 && me.x <= this.xC + 4)
    { me.y = this.yS - 1; leaving = true; }//ZZ
    break;
  case 'E':
    if (me.x >= this.xE && me.y >= this.yC - 4 && me.y <= this.yC + 4)
    { me.x = this.xE + 1; leaving = true; }//ZZ
    break;
  case 'W':
    if (me.x <= this.xW && me.y >= this.yC - 4 && me.y <= this.yC + 4)
    { me.x = this.xW - 1; leaving = true; }//ZZ
    break;
  }
  if (leaving)
  { me.inside = null;
    forest.scene.draw();
  }
  else
  { if (me.x < this.xW + 0.5) me.x = this.xW + 1;
    else if (me.x > this.xE - 0.5) me.x = this.xE - 1;
    if (me.y < this.yS + 0.5) me.y = this.yS + 1;
    else if (me.y > this.yN - 0.5) me.y = this.yN - 1;
    this.draw();
} };

Inside.prototype.doLift = function()
{ if (this.liftHt > 0 && this.meHt === 0)
  { this.liftCalled = true;
    this.draw();
    requestAnimationFrame(callLift);
  }
  else
  { var me = forest.observer;
    if (this.xE - me.x < 2 && this.yN - me.y < 2)
    { this.da = (225 - me.b) / 8;
      requestAnimationFrame(turnInLift);
  } }
};

function callLift()
{ var foi = forest.observer.inside;
  foi.draw();
  if (foi.liftHt > 0)
  { foi.liftHt--;
    requestAnimationFrame(callLift);
} }

function turnInLift()
{ var me = forest.observer;
  me.b += me.inside.da;
  me.inside.draw();
  if (Math.abs (me.b - 225) > 10) requestAnimationFrame(turnInLift);
  else requestAnimationFrame(ascend);
}

function ascend()
{ var me = forest.observer, foi = me.inside;
  foi.draw();
  if (foi.meHt < UPPER_LEVEL)
  { foi.meHt++;
    requestAnimationFrame(ascend);
  }
  else foi.liftHt = UPPER_LEVEL;
}

function descend()
{ var me = forest.observer, foi = me.inside;
  foi.draw();
  if (foi.meHt > 0)
  { foi.meHt--;
    requestAnimationFrame(descend);
  }
  else foi.liftHt = 0;
}

Inside.prototype.drawLift = function()
{ var xIn = this.xE - 2, yIn = this.yN - 2;
  var sxy = new Array(4);
  // Floor:
  sxy[0] = this.getScreenXY(xIn + 2, yIn + 2, this.liftHt);
  sxy[1] = this.getScreenXY(xIn, yIn + 2, this.liftHt);
  sxy[2] = this.getScreenXY(xIn, yIn, this.liftHt);
  sxy[3] = this.getScreenXY(xIn + 2, yIn, this.liftHt);
  var d = this.fa.aroundGet(xIn, yIn).d;
  this.g2.lineWidth = Math.max(3, 15 / d);
  this.g2.beginPath();
  this.g2.moveTo(sxy[0].x, sxy[0].y);
  this.g2.lineTo(sxy[1].x, sxy[1].y);
  this.g2.lineTo(sxy[2].x, sxy[2].y);
  this.g2.lineTo(sxy[3].x, sxy[3].y);
  this.g2.closePath ();
  this.g2.fillStyle = (this.liftHt > forest.observer.ME_HT + this.meHt) ? '#000' :'#d95'; 
  this.g2.fill();
  this.g2.strokeStyle = '#b73';
  this.g2.stroke();
  // Wires:
  this.g2.strokeStyle = '#bbb';
  for (var i = 1; i < 4; i++)
  { this.g2.beginPath();
    this.g2.moveTo(sxy[i].x, sxy[i].y);
    this.g2.lineTo(sxy[i].x, 0);
    this.g2.stroke();
  }  
  this.g2.lineWidth = 1;
};

Inside.prototype.doDrain = function()
{ if (this.pumping) return;
  if (forest.terrain.lakeHt < forest.terrain.LAKE_HT0)
  { message("The water is already drained", "and the mines are flooded"); return; }
  this.pumping = true;
  this.itNo = 1;
  var it = this.imTexts[this.itNo];
  this.g2.drawImage(it.im, this.mapTL.x, this.mapTL.y);
  this.g2.fillStyle = '#fff';
  this.g2.fillRect(this.textBox.x, this.textBox.y, this.textBox.w, this.textBox.h);
  this.g2.fillStyle = '#555';
  this.g2.font = "bold 24px sans-serif";
  this.g2.fillText(it.text + "m", this.textTL.x, this.textTL.y);
  setTimeout(drain, 1000);
};

function drain()
{ var foi = forest.observer.inside;
  if (foi.itNo < foi.imTexts.length - 1)
  { foi.itNo++;
    var it = foi.imTexts[foi.itNo];
    foi.g2.drawImage(it.im, foi.mapTL.x, foi.mapTL.y);
    foi.g2.fillStyle = '#fff';
    foi.g2.fillRect(foi.textBox.x, foi.textBox.y, foi.textBox.w, foi.textBox.h);
    foi.g2.fillStyle = '#555';
    foi.g2.font = "bold 24px sans-serif";
    foi.g2.fillText(it.text + "m", foi.textTL.x, foi.textTL.y);
    setTimeout(drain, 1000);
  }
  else
  { forest.terrain.lakeHt = 20; 
    Mine.prototype.flooded = true; // Mine may not have been constructed yet
    foi.pumping = false;
} }

Inside.prototype.doRefill = function()
{ if (this.pumping) return;
  if (forest.terrain.lakeHt >= forest.terrain.LAKE_HT0)
  { message ("The water is up to level", "and the mines are dry"); return; }
  this.pumping = true;
  this.itNo = this.imTexts.length - 1;
  var it = this.imTexts[this.itNo];
  this.g2.drawImage(it.im, this.mapTL.x, this.mapTL.y);
  this.g2.fillStyle = '#fff';
  this.g2.fillRect(this.textBox.x, this.textBox.y, this.textBox.w, this.textBox.h);
  this.g2.fillStyle = '#555';
  this.g2.font = "bold 24px sans-serif";
  this.g2.fillText(it.text + "m", this.textTL.x, this.textTL.y);
  setTimeout(refill, 1000);
};

function refill()
{ var foi = forest.observer.inside;
  if (foi.itNo > 0)
  { foi.itNo--;
    var it = foi.imTexts[foi.itNo];
    foi.g2.drawImage(it.im, foi.mapTL.x, foi.mapTL.y);
    foi.g2.fillStyle = '#fff';
    foi.g2.fillRect(foi.textBox.x, foi.textBox.y, foi.textBox.w, foi.textBox.h);
    foi.g2.fillStyle = '#555';
    foi.g2.font = "bold 24px sans-serif";
    foi.g2.fillText(it.text + "m", foi.textTL.x, foi.textTL.y);
    setTimeout(refill, 1000);
  }
  else
  { forest.terrain.lakeHt = forest.terrain.LAKE_HT0; 
    Mine.prototype.flooded = false; 
    foi.pumping = false;
} }

Inside.prototype.handleClick = function(x, y)
{ if (this.pumping) return; // Must wait
  if (this.hasLift && inBounds (x, y, this.upLiftBounds)) this.doLift();
  if (inBounds(x, y, this.refillBounds)) this.doRefill();
  if (inBounds(x, y, this.drainBounds)) this.doDrain();
  if (inBounds(x, y, this.downBounds)) descend();
};

function inBounds(x, y, b)
{ return (undefined !== b && x >= b.xL && x <= b.xR && y >= b.yT && y <= b.yB); }