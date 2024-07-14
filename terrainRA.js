// Part of The Random Forest
// Copyright (c) Graham Relf, UK, 2014-24
// www.grelf.net
'use strict';
const TWO_PI = 2 * Math.PI;

const TERRAINS = 
{ LAKE:20, TOWN:21, GRASS:22, MOOR:23, WOOD:24, THICKET:25, Z:26,
  ROAD:27, MUD:28, PATH:29, STREAM:30, MARSH:31, SNOW:32,
  getName:function(t)
  { switch (t)
    {
case this.LAKE: return "Water";
case this.TOWN: return "Paved/town";
case this.GRASS: return "Grass";
case this.MOOR: return "Moor";
case this.WOOD: return "Open wood";
case this.THICKET: return "Thicket";
case this.Z: "Barren";
case this.ROAD: return "Road";
case this.MUD: return "Mud";
case this.PATH: return "Path";
case this.STREAM: return "Stream";
case this.MARSH: return "Marsh";
case this.SNOW: return "Snow";
default: return "Unknown terrain " + t;
} } };
// NB: terrain numbers must differ from feature numbers: all may be used in place()

const FEATURES = 
{ NONE:0, MINE:1, BOULDER:3, ROOT:4, WATERHOLE:5, KNOLL:6, X:7, CONE:8, T:9, METAL:10,
  getName:function(f)
  { switch (f)
    {
case this.NONE: return "No feature";
case this.MINE: return "Mineshaft";
case this.BOULDER: return "Boulder";
case this.ROOT: return "Rootstock";
case this.WATERHOLE: return "Pond";
case this.KNOLL: return "Knoll";
case this.CONE: return "Cone";//On open ground can be a helicopter
case this.T: return "Phone box";
case this.METAL: return "Metal";
default: return "Unknown feature " + f;
} } };

function Terrain()
{ this.NSUMS = 5;
  this.RECIP128 = 1 / 128;
  this.bleak = false;
  this.mapMode = true;
  this.placed = {};
  this.roads = [];
  this.PROFILE_LENGTH = 2048;//Must be power of 2
  this.makeProfile();
  this.PROFILE_MASK = this.PROFILE.length - 1;
  this.AH = new Array(5);
  this.BH = new Array(5);
  var ch = [19,13,23,17,15];
  for (var i = 0, a = 0; i < 5; i++, a += TWO_PI * 0.2)
  { this.AH[i] = Math.round(ch[i] * Math.sin(a));
    this.BH[i] = Math.round(ch[i] * Math.cos(a));
  }
  this.A1 = [-43, -43, -56, 31, 4];
  this.B1 = [-3, -12, 22, 2, 32];
  this.A2 = [-24, -25, 60, 10, - 30];
  this.B2 = [15, -54, -34, -51, -43];
  this.A3 = [-51, -62, -58, -64, 33];
  this.B3 = [-44, 20, 27, -64, -44];
}

Terrain.prototype.makeProfile = function()//random!
{ let L = this.PROFILE_LENGTH, P = new Array(L);
  for (let i = 0; i < L; i++) P[i] = 0;
  let nSines = 32;
  let MIN_A = 16, MAX_A = 90;//Amplitude
  let MIN_N = 2, MAX_N = L / 32;//No of cycles
  for (let i = 0; i < nSines; i++)
  { let a = random(MIN_A, MAX_A);
    let n = Math.round(random(MIN_N, MAX_N));
    let lamda = L / n;//Wavelength
    let phase = random(0, TWO_PI);
    for (let j = 0; j < L; j++)
    { P[j] += Math.round((a * Math.sin(phase + TWO_PI * j / lamda)) / 8);
  } }
  let minHt = 10000, maxHt = 0;
  for (let i = 0; i < L; i++)
  { let pi = P[i];
    if (pi > maxHt) maxHt = pi;
    else if (pi < minHt) minHt = pi;
  }
  this.LAKE_HT0 = this.lakeHt = 34;
  this.snowHt = maxHt * 2.4;
  this.PROFILE = P;
};

function random(min, max) { return min + Math.random() * (max - min); }

Terrain.prototype.place = function(x, y, n) { this.placed[x + ',' + y] = n; };
Terrain.prototype.atPlace = function(x, y) { return this.placed[x + ',' + y]; };
Terrain.prototype.remove = function(x, y) { delete this.placed[x + ',' + y]; };

/* Returns object with 3 or 4 properties:
height (Number), terrain (TERRAINS.Number), feature (FEATURES.Number).
In a lake there is also depth (Number) */
Terrain.prototype.terra = function(x, y)
{ var a, b, feature = FEATURES.NONE, ht = this.calcHeight(x, y);
  if (this.bleak)
  { if (this.lakeHt > ht) return {height:this.lakeHt, terrain:TERRAINS.LAKE, 
      depth:this.lakeHt - ht, feature:feature};
    return {height:ht, terrain:TERRAINS.Z, feature:feature};
  }
  var xr = Math.round(x), yr = Math.round(y), xryr = xr * yr;
  var pd = this.placed[xr + ',' + yr];
  if (undefined !== pd)
  { switch (pd)
    {
case TERRAINS.STREAM: if (this.mapMode) break;
case TERRAINS.WOOD://RA
case TERRAINS.GRASS://RA
case TERRAINS.MOOR://RA
case TERRAINS.ROAD:
    return {height:Math.max(ht, this.lakeHt), terrain:pd, feature:FEATURES.NONE};
case FEATURES.NONE: //To hide cone where helicopter left
case FEATURES.CONE: feature = pd; break;
case FEATURES.METAL:
case FEATURES.T: return {height:ht, terrain:TERRAINS.GRASS, feature:pd};//RA
  } }
  if (this.lakeHt > ht) return {height:this.lakeHt, terrain:TERRAINS.LAKE, 
      depth:this.lakeHt - ht, feature:feature};
  if (this.LAKE_HT0 > ht) return {height:ht, terrain:TERRAINS.MUD, feature:feature};
  if (FEATURES.NONE === feature && pd !== FEATURES.NONE)
  { var xryr = xr * yr;
    a = this.calcProf(this.B2, xr, this.A3, yr);// NB: Swapped A/B tables
    var f = Math.round(a * xryr * this.RECIP128) & 0xfff;
    if (4 === f) 
    { var xyff = xryr & 0xff;
      if (xyff < 64) feature = FEATURES.MINE;
      else if (xyff < 128) feature = FEATURES.BOULDER;
      else if (xyff < 160) feature = FEATURES.WATERHOLE;
      else if (xyff < 200) feature = FEATURES.KNOLL;
      else feature = FEATURES.ROOT;
    }
    else if (8 === f && (Math.round (PI1000 * xryr) & 0xff) < 32) feature = FEATURES.X;
    else if (16 === f && (Math.round(PI10000 * xryr) & 0xff) < 24) feature = FEATURES.CONE;
  }
  if (ht > this.snowHt) return {height:ht, terrain:TERRAINS.SNOW, feature:feature};
  a = this.calcProf(this.A1, x, this.B1, y);
  if (10 > Math.abs(a)) return {height:ht, terrain:TERRAINS.TOWN, feature:FEATURES.NONE};
  a = this.calcProf(this.A2, x, this.B2, y);
  b = this.calcProf(this.A3, x, this.B3, y);
  if (20 > a)
  { if (20 > b) return {height:ht, terrain:TERRAINS.GRASS, feature:feature};
    return {height:ht, terrain:TERRAINS.MOOR, feature:feature};
  }
  if (-50 > b) return {height:ht, terrain:TERRAINS.THICKET, feature:feature};
  return {height:ht, terrain:TERRAINS.WOOD, feature:feature};
};

Terrain.prototype.calcProf = function(A, x, B, y)
{ var z = 0;
  for (var i = 0; i < this.NSUMS; i++)
  { z += this.PROFILE[Math.floor((A[i] * x + B[i] * y) >> 7) & this.PROFILE_MASK]; }
  return z;
};

Terrain.prototype.calcHeight = function(x, y)
{ var ht = 0;
  for (var i = 0; i < this.NSUMS; i++)
  { var j = (this.AH[i] * x + this.BH[i] * y) * this.RECIP128;
    var jint = Math.floor(j);
    var jfrac = j - jint;
    var prof0 = this.PROFILE[jint & this.PROFILE_MASK];
    var prof1 = this.PROFILE[(jint + 1) & this.PROFILE_MASK];
    ht += prof0 + jfrac * (prof1 - prof0); // interpolate
  }
  return ht;
};

/* From starting (x0, y0) return a nearby position which is 
 * in wood/grass/moor and not on a feature
 * and >= 7m from any mineshaft
 * and >= 10m from lake/town/thicket
 * NB: Optional extra string parameter to help report failure
 * Returns {x, y, ok}
 */
Terrain.prototype.findGoodSite = function(x, y)
{ let ht = this.calcHeight(x, y) - this.lakeHt, i = 0;
  //Ensure on land, by big jumps:
  while (ht < 10)
  { x -= 100; y += 100;
    ht = this.calcHeight(x, y) - this.lakeHt;
    i++;
    if (i > 1000)//Avoid infinite loop
    { let na = arguments.length;
      let s = (na > 2) ?  " (" + arguments[na - 1] + ")" : "";
      console.log("Cannot find non-lake good place, i = " + i + s);
      return {x:x, y:y, ok:false};
  } }
  return this.findGoodSitePart2(x, y, true);
};

// Alternative entry point if the initial big jumps are not wanted
// May also want to control whether the map can be redrawn locally (would erase features)
Terrain.prototype.findGoodSitePart2 = function(x, y, mayChangeMap)
{ let tr = this.terra(x, y), tt = tr.terrain, tf = tr.feature;
  if (tf === FEATURES.NONE
   && (tt === TERRAINS.WOOD || tt === TERRAINS.GRASS || tt === TERRAINS.MOOR
   && !this.nearFeature(x, y, 7, FEATURES.MINE) && !this.nearFeature(x, y, 5, FEATURES.T)));
  { let dd = this.checkArea(x, y);
    if (dd.dx >= 20 && dd.dy >= 20)
    { if (x - dd.xL < 10) x = dd.xL + 10;
      else if (dd.xR - x < 10) x = dd.xR - 10;
      if (y - dd.yB < 10) y = dd.yB + 10;
      else if (dd.yT - y < 10) y = dd.yT - 10;
      return {x:x, y:y, ok:true};
  } }
//  console.log("Spiral");// Try spiralling round:  
  let r = 8, dr = 8, a = TWO_PI * Math.random(), n = 8, da = TWO_PI / n;
  let sins = [], coss = [];
  for (let i = 0; i < n; i++)
  { let aida = a + i * da;
    sins.push(Math.sin(aida));
    coss.push(Math.cos(aida));
  }
  let j = 0;
  do
  { let i = 0;
    x += r * sins[i]; y += coss[i];
    tr = this.terra(x, y), tt = tr.terrain, tf = tr.feature;
    i++; j++;
    if (j > 1000)//Avoid infinite loop
    { let na = arguments.length;
      let s = (na > 2) ?  " (" + arguments[na - 1] + ")" : "";
      console.log("Cannot find wood/grass/moor good place, j = " + j + s);
      return {x:x, y:y, ok:false};
    }
    if (i >= n)
    { i = 0;
      r += dr;
  } }
  while (tr.height - this.lakeHt < 10 || tf !== FEATURES.NONE
      || this.nearFeature(x, y, 7, FEATURES.MINE) || this.nearFeature(x, y, 5, FEATURES.T)
      || (tt !== TERRAINS.WOOD && tt !== TERRAINS.GRASS && tt !== TERRAINS.MOOR));
  let dd = this.checkArea(x, y);
  if (dd.dx >= 20 && dd.dy >= 20)
  { if (x - dd.xL < 10) x = dd.xL + 10;
    else if (dd.xR - x < 10) x = dd.xR - 10;
    if (y - dd.yB < 10) y = dd.yB + 10;
    else if (dd.yT - y < 10) y = dd.yT - 10;
    return {x:x, y:y, ok:true};
  }
  else if (mayChangeMap)
  { //console.log("Making patch of " + tt);
    if (tt !== TERRAINS.WOOD && tt !== TERRAINS.GRASS && tt !== TERRAINS.MOOR)
    { console.log("Patch error, tt = " + tt);
      return {x:x, y:y, ok:false};
    }
    let xr = Math.round(x), yr = Math.round(y);
    for (let dx = -20; dx <= 20; dx++)
    { let dx2 = dx * dx;
      for (let dy = -20; dy <= 20; dy++)
      { if (dx2 + dy * dy <= 400)
        { this.place(xr + dx, yr + dy, tt);
    } } }
    return {x:x, y:y, ok:true};
  }
  else return {x:x, y:y, ok:false};
};

Terrain.prototype.checkArea = function(x0, y0)
{ let xr = Math.round(x0), yr = Math.round(y0), tt;
  let x = xr, y = yr;
  do
  { x++; tt = this.terra(x, y).terrain;
  }
  while (tt === TERRAINS.WOOD || tt === TERRAINS.GRASS || tt === TERRAINS.MOOR);
  let xR = x - 1; 
  x = xr; y = yr;
  do
  { x--; tt = this.terra(x, y).terrain;
  }
  while (tt === TERRAINS.WOOD || tt === TERRAINS.GRASS || tt === TERRAINS.MOOR);
  let xL = x + 1;
  x = xr; y = yr;
  do
  { y++; tt = this.terra(x, y).terrain;
  }
  while (tt === TERRAINS.WOOD || tt === TERRAINS.GRASS || tt === TERRAINS.MOOR);
  let yT = y - 1;
  x = xr; y = yr;
  do
  { y--; tt = this.terra(x, y).terrain;
  }
  while (tt === TERRAINS.WOOD || tt === TERRAINS.GRASS || tt === TERRAINS.MOOR);
  let yB = y + 1;
//  console.log("dx:" + (xR - xL) + " dy:" + (yT - yB));
  return {dx:xR - xL, dy:yT - yB, xL:xL, xR:xR, yB:yB, yT:yT};
};

// Tests whether (x, y) is in d-sized square round feature f
Terrain.prototype.nearFeature = function(x, y, d, f)
{ for (let dx = -d; dx <= d; dx++)
  { for (let dy = -d; dy <= d; dy++)
    { if (this.terra(x + dx, y + dy).feature === f) return true;
  } }
  return false;  
};