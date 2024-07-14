// Part of The Forest
// Copyright (c) Graham Relf, UK, 2018-24
// www.grelf.net
'use strict';
Building.prototype.WIDTH = 12; // Must be even
Building.prototype.HALFWIDTH = 6;
Building.prototype.N_FILL = "#999";
Building.prototype.S_FILL = "#ddd";
Building.prototype.SIDE_FILL = "#bbb";
Building.prototype.DOOR_HT = 18;// 21.8.26 was 10
Building.prototype.DOOR_WD = 2;// New 21.8.26 Must be integer

function inABuilding (x, y) // Must draw scene first
{ var fs = forest.scene;
  var hwd = Building.prototype.HALFWIDTH + 1;
  for (var i = 0; i < fs.nBuildings; i++)
  { var bld = fs.buildings [i];
    if (Math.abs (x - bld.xC) < hwd && Math.abs (y - bld.yC) < hwd) return true;  
  }
  return false;
}

function Building (xCentre, yCentre)
{ this.xC = xCentre;
  this.yC = yCentre;
  this.fa = forest.around;
  this.fs = forest.scene;
  this.me = forest.observer;
  this.g2 = forest.screen.g2;
  this.pixy = PI10000 * xCentre * yCentre;
  var pixy1f = this.pixy & 0x7f;//0x3f;
  this.ht = 60 + pixy1f * pixy1f / 0x7f;//0x3f;
  this.nStoreys = Math.max (this.ht - 70, 0) / 20 + 1;
  this.xW = xCentre - this.HALFWIDTH;
  this.xE = xCentre + this.HALFWIDTH;
  this.yN = yCentre + this.HALFWIDTH;
  this.yS = yCentre - this.HALFWIDTH;
  this.spNW = this.fa.aroundGet (this.xW, this.yN);
  this.spNE = this.fa.aroundGet (this.xE, this.yN);
  this.spSW = this.fa.aroundGet (this.xW, this.yS);
  this.spSE = this.fa.aroundGet (this.xE, this.yS);
  this.baseHt = this.spNW.getTerra ().height;
  var grdHt = this.spNE.getTerra ().height; if (grdHt < this.baseHt) this.baseHt = grdHt;
  grdHt = this.spSW.getTerra ().height; if (grdHt < this.baseHt) this.baseHt = grdHt;
  grdHt = this.spSE.getTerra ().height; if (grdHt < this.baseHt) this.baseHt = grdHt;
  this.baseHt -= 10;// No gaps
  this.top = this.baseHt + this.ht;
  this.fogNo = 0;
  var dNr = Math.min (this.spNW.d, this.spNE.d, this.spSE.d, this.spSW.d) / forest.scene.range_m;
  if (dNr > 0.75) this.fogNo = (dNr - 0.75) * 4; // 0..1
  switch (this.pixy & 0x3)
  {
  case 0:
    this.doorSide = "W";
    this.spDoorL = this.fa.aroundGet (this.xW, yCentre + this.DOOR_WD);
    this.spDoorR = this.fa.aroundGet (this.xW, yCentre);
    break;
  case 1:
    this.doorSide = "N";
    this.spDoorL = this.fa.aroundGet (xCentre + this.DOOR_WD, this.yN);
    this.spDoorR = this.fa.aroundGet (xCentre, this.yN);
    break;
  case 2:
    this.doorSide = "E";
    this.spDoorL = this.fa.aroundGet (this.xE, yCentre - this.DOOR_WD);
    this.spDoorR = this.fa.aroundGet (this.xE, yCentre);
    break;
  case 3:
    this.doorSide = "S";
    this.spDoorL = this.fa.aroundGet (xCentre - this.DOOR_WD, this.yS);
    this.spDoorR = this.fa.aroundGet (xCentre, this.yS);
    break;
  }
  this.doorFill = makeCssColour (this.pixy & 0xff, (this.pixy & 0xff00) >> 8,
        (this.pixy & 0xff0000) >> 16).toLowerCase ();
  var me = forest.observer;
  if (Math.abs (me.x - this.spDoorL.x) < 7 && Math.abs (me.y - this.spDoorL.y) < 7) me.building = this;
  else me.building = null;
}

Building.prototype.atCentre = function (x, y) 
{ return 0 === (x & 0xf) && 0 === (y & 0xf) && ((PI10000 * x * y) & 0xf) < 8 ; };
//  -6           C          +6
// 9 a b c d e f 0 1 2 3 4 5 6 7 8
//     b   d   f   1   3   5  

// Code corners/edges/inside by property fnd on the ScenePoint at around [oddX][oddY]:
// 8 1 2
// 7 0 3
// 6 5 4
Building.prototype.markFoundations = function ()
{ var x, y, sp, xW1 = this.xW + 1, xE1 = this.xE - 1, yS1 = this.yS + 1, yN1 = this.yN - 1;
  for (x = xW1 + 2; x < xE1; x += 2) 
  { for (y = yS1 + 2 + 1; y < yN1; y++) 
    { sp = this.fa.aroundGet (x, y); sp.fnd = 0; } 
  } 
  for (x = xW1; x <= xE1; x += 2) 
  { for (y = yS1; y <= yN1; y += 2) 
    { sp = this.fa.aroundGet (x, y); sp.building = this; }
  }
  for (x = xW1 + 2; x < xE1; x += 2) 
  { sp = this.fa.aroundGet (x, yN1); sp.fnd = 1; 
    sp = this.fa.aroundGet (x, yS1); sp.fnd = 5; 
  }
  for (y = yS1 + 2; y < yN1; y += 2) 
  { sp = this.fa.aroundGet (xW1, y); sp.fnd = 7;
    sp = this.fa.aroundGet (xE1, y); sp.fnd = 3; 
  }
  sp = this.fa.aroundGet (xW1, yN1); sp.fnd = 8; 
  sp = this.fa.aroundGet (xE1, yN1); sp.fnd = 2; 
  sp = this.fa.aroundGet (xE1, yS1); sp.fnd = 4; 
  sp = this.fa.aroundGet (xW1, yS1); sp.fnd = 6;
};

Building.prototype.drawPart = function (x, y, mex, mey, range_m)
{ if (x > mex - range_m && x < mex + range_m - 1
   && y > mey - range_m && y < mey + range_m - 1)
  { var sp0 = this.fa.aroundGet (x, y); // x & y odd
    var fill12, fill23, door, sp1, sp2, sp3 = null;
    switch (sp0.fnd)
    { case 1://N 
        fill12 = fog (this.N_FILL, this.fogNo); 
        door = this.doorSide === "N" && x - this.xC === 1; 
        sp1 = this.fa.aroundGet (x + 1, y + 1);
        sp2 = this.fa.aroundGet (x - 1, y + 1);
        break;
      case 2://NE
        fill12 = fog (this.SIDE_FILL, this.fogNo);
        fill23 = fog (this.N_FILL, this.fogNo);
        door = false;
        sp1 = this.fa.aroundGet (x + 1, y - 1);
        sp2 = this.spNE;
        sp3 = this.fa.aroundGet (x - 1, y + 1);
        break;
      case 3://E 
        fill12 = fog (this.SIDE_FILL, this.fogNo);
        door = this.doorSide === "E" && y - this.yC === -1; 
        sp1 = this.fa.aroundGet (x + 1, y - 1);
        sp2 = this.fa.aroundGet (x + 1, y + 1);
        break;
      case 4://SE
        fill12 = fog (this.S_FILL, this.fogNo);
        fill23 = fog (this.SIDE_FILL, this.fogNo);
        door = false;
        sp1 = this.fa.aroundGet (x - 1, y - 1);
        sp2 = this.spSE;
        sp3 = this.fa.aroundGet (x + 1, y + 1);
        break;
      case 5://S
        fill12 = fog (this.S_FILL, this.fogNo); 
        door = this.doorSide === "S" && x - this.xC === -1; 
        sp1 = this.fa.aroundGet (x - 1, y - 1);
        sp2 = this.fa.aroundGet (x + 1, y - 1);
        break;
      case 6://SW
        fill12 = fog (this.SIDE_FILL, this.fogNo);
        fill23 = fog (this.S_FILL, this.fogNo);
        door = false;
        sp1 = this.fa.aroundGet (x - 1, y + 1);
        sp2 = this.spSW;
        sp3 = this.fa.aroundGet (x + 1, y - 1);
        break;
      case 7://W 
        fill12 = fog (this.SIDE_FILL, this.fogNo); 
        door = this.doorSide === "W" && y - this.yC === 1; 
        sp1 = this.fa.aroundGet (x - 1, y + 1);
        sp2 = this.fa.aroundGet (x - 1, y - 1);
        break;
      case 8://NW
        fill12 = fog (this.N_FILL, this.fogNo);
        fill23 = fog (this.SIDE_FILL, this.fogNo);
        door = false;
        sp1 = this.fa.aroundGet (x + 1, y + 1);
        sp2 = this.spNW;
        sp3 = this.fa.aroundGet (x - 1, y - 1);
        break;
      default: return;//Inside
    }
    if (null !== sp3)
    { if (sp1.d > sp3.d)
      { this.drawWall (sp1, sp2, fill12, false, false);
        this.drawWall (sp2, sp3, fill23, false, false);
      } else
      { this.drawWall (sp3, sp2, fill23, false, false);
        this.drawWall (sp2, sp1, fill12, false, false);
    } }
    else this.drawWall (sp1, sp2, fill12, door, true);
// Roof:
    if ((this.top - this.fs.ht0) * this.fs.YSCALE < this.me.ht)
    { var xy1 = this.getScreenXY (this.spNE, this.top);
      var xy2 = this.getScreenXY (this.spSE, this.top);
      var xy3 = this.getScreenXY (this.spSW, this.top);
      var xy4 = this.getScreenXY (this.spNW, this.top);
      this.g2.beginPath ();
      this.g2.moveTo (xy1.x, xy1.y);
      this.g2.lineTo (xy2.x, xy2.y);
      this.g2.lineTo (xy3.x, xy3.y);
      this.g2.lineTo (xy4.x, xy4.y);
      this.g2.closePath ();
      this.g2.fillStyle = fogRGB (85, 85, 85, this.fogNo);//#555
      this.g2.fill ();
  } }    
};

Building.prototype.drawWall = function (sp1, sp2, fill, door, window)
{ var b1 = this.getScreenXY (sp1, this.baseHt);
  var t1 = this.getScreenXY (sp1, this.top);
  var b2 = this.getScreenXY (sp2, this.baseHt);
  var t2 = this.getScreenXY (sp2, this.top);
  this.g2.beginPath ();
  this.g2.moveTo (b1.x, b1.y);
  this.g2.lineTo (t1.x, t1.y);
  this.g2.lineTo (t2.x, t2.y);
  this.g2.lineTo (b2.x, b2.y);
  this.g2.closePath ();
  this.g2.fillStyle = fog (fill, this.fogNo);
  this.g2.strokeStyle = this.g2.fillStyle;
  this.g2.fill ();
  this.g2.stroke ();
  if (window)
  { this.g2.fillStyle = fogRGB (100, 120, 150, this.fogNo);
    this.g2.lineWidth = Math.max (1, 50 / sp1.d);//ZZ
    var th = this.baseHt + this.ht;
    this.drawWindow (sp1, sp2, th - 18, th - 5);
    if (!door)
    { if (this.nStoreys > 1) this.drawWindow (sp1, sp2, th - 38, th - 25);
      if (this.nStoreys > 2) this.drawWindow (sp1, sp2, th - 58, th - 45);
      if (this.nStoreys > 3) this.drawWindow (sp1, sp2, th - 78, th - 65);
      if (this.nStoreys > 4) this.drawWindow (sp1, sp2, th - 98, th - 85);
      if (this.nStoreys > 5) this.drawWindow (sp1, sp2, th - 118, th - 105);
      if (this.nStoreys > 6) this.drawWindow (sp1, sp2, th - 138, th - 125);
      if (this.nStoreys > 7) this.drawWindow (sp1, sp2, th - 158, th - 145);
    }
    this.g2.lineWidth = 1;
  }
  if (door)
  { this.g2.fillStyle = fog (this.doorFill, this.fogNo);
    this.g2.strokeStyle = fogRGB (63, 63, 63, this.fogNo);
    var base = Math.max (sp1.getTerra ().height, sp2.getTerra ().height);
    b1 = this.getScreenXY (this.spDoorL, base);
    t1 = this.getScreenXY (this.spDoorL, base + this.DOOR_HT);
    b2 = this.getScreenXY (this.spDoorR, base);
    t2 = this.getScreenXY (this.spDoorR, base + this.DOOR_HT);
    this.doorShape = {b1:b1, t1:t1, b2:b2, t2:t2};//ZZ
    this.g2.beginPath ();
    this.g2.moveTo (b1.x, b1.y);
    this.g2.lineTo (t1.x, t1.y);
    this.g2.lineTo (t2.x, t2.y);
    this.g2.lineTo (b2.x, b2.y);
    this.g2.closePath ();
    this.g2.fill ();
    this.g2.stroke ();
  }
};

Building.prototype.drawWindow = function (sp1, sp2, bw, tw)
{ var b1 = this.getScreenXY (sp1, bw);
  var t1 = this.getScreenXY (sp1, tw);
  var b2 = this.getScreenXY (sp2, bw);
  var t2 = this.getScreenXY (sp2, tw);
  this.g2.beginPath ();
  this.g2.moveTo (b1.x, b1.y);
  this.g2.lineTo (t1.x, t1.y);
  this.g2.lineTo (t2.x, t2.y);
  this.g2.lineTo (b2.x, b2.y);
  this.g2.closePath ();
  this.g2.fill ();
  this.g2.stroke ();
};

Building.prototype.getScreenXY = function (sp, ht)
{ var sinb, cosb;
  var brad = sp.b * DEG2RAD; sinb = Math.sin (brad); cosb = Math.cos (brad);
  var zz = sp.d * cosb;
if (zz < 1) zz = 1;
  var fRatio = this.fs.FF / zz;
  var sx = fRatio * sp.d * sinb + this.fs.wd2;
  var sy = this.fs.htBase - fRatio * ((ht - this.fs.ht0) * this.fs.YSCALE - this.me.ht);
  return {x:sx, y:sy};
};

Building.prototype.enter = function ()
{ //EP:
  var me = forest.observer;
  switch (this.doorSide)
  {
    case 'N': if (me.x < this.xC - 4 || me.x > this.xC + 4 || Math.abs (me.y - this.yN) > 7) return;
              break;
    case 'S': if (me.x < this.xC - 4 || me.x > this.xC + 4 || Math.abs (me.y - this.yS) > 7) return;
              break;
    case 'E': if (me.y < this.yC - 4 || me.y > this.yC + 4 || Math.abs (me.x - this.xE) > 7) return;
              break;
    case 'W': if (me.y < this.yC - 4 || me.y > this.yC + 4 || Math.abs (me.x - this.xW) > 7) return;
              break;
  }
  if (me.role === ROLES.LOCKSMITH)
  { if (random(0, 5) < 1)
    { message (
"As a locksmith you have",
"been able to measure",
"something, so you know",
"that the key code here",
"is " + this.doorFill.substring(1), true);
      me.role = ROLES.EXPLORER;
      document.getElementById("role").selectedIndex = 0;
      return;
  } }
  let kc = prompt ("What is the key code?");
  if (null !== kc && ('#' + kc.toLowerCase ()) === this.doorFill)
  { var door = this.doorShape;
    this.g2.beginPath ();
    this.g2.moveTo (door.b1.x, door.b1.y);
    this.g2.lineTo (door.t1.x, door.t1.y);
    this.g2.lineTo (door.t2.x, door.t2.y);
    this.g2.lineTo (door.b2.x, door.b2.y);
    this.g2.closePath ();
    this.g2.fillStyle = '#fff';
    forest.animData = {stepNo:0, nSteps:20, g2:this.g2};
    openBldDoor ();
  }//:EP    
};
function openBldDoor ()
{ var fad = forest.animData;
  fad.stepNo++;
  fad.g2.globalAlpha = fad.stepNo / fad.nSteps;
  fad.g2.fill ();
  if (fad.stepNo < fad.nSteps) setTimeout (openBldDoor, 50);
  else stepInside ();//in inside.js
}