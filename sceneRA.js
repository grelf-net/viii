// Part of The Forest
// Copyright (c) Graham Relf, UK, 2014-24
// www.grelf.net
'use strict';
Scene.prototype.FF = 566;// For perspective
Scene.prototype.YSCALE = 0.22;// Ground height scale
Scene.prototype.FSCALE = 8;// Feature height scale

function Scene (screen)
{ this.drawingTimes = '';
  this.ht = screen.ht;
  this.htBase = Math.floor (this.ht * 0.6);
  this.wd = screen.wd;
  this.wd2 = this.wd / 2;
  let r = 100;
  this.range_m = r;
  this.rangeSq = r * r;
  this.doFog = true;
  this.clipping = false;
  this.BHWD = Building.prototype.HALFWIDTH;
  this.BWD = Building.prototype.WIDTH;
  this.buildings = null;
  this.nBuildings = 0;
  this.reset();
  this.bMimas = 180;
  this.skyR = 170; this.skyG = 221; this.skyB = 255;
  this.SUN_R = 170; this.SUN_G = 221; this.SUN_B = 255;
  this.WET_R = 102; this.WET_G = 102; this.WET_B = 102;
  this.BLK_R = 0; this.BLK_G = 0; this.BLK_B = 0;
  this.cssMUD = '5c270e';//RA was '#764';
  this.cssSUN = makeCssColour (this.SUN_R, this.SUN_G, this.SUN_B);
  this.cssWET = makeCssColour (this.WET_R, this.WET_G, this.WET_B);
  this.cssBLK = '#000';
  this.MUD = '5c270e';//RA was '#764';
  var maxRange = forest.around.aMid, wdR = maxRange * 2 + 1;//ET
  this.ahead = new Array (wdR * maxRange);//ET
  this.nAhead = 0;//ET
  this.createHeliButtons ();//EX
  this.woodpatch = loadImage ("woodpatch.png");
  this.grasspatch = loadImage ("grasspatch1.png");
  this.moorpatch = loadImage ("moorpatch1.png");
  this.marshpatch = loadImage ("marshpatch.png");
  this.wood01 = loadImage ("wood09.png");
  this.wood02 = loadImage ("wood02a.png");
  this.wood03 = loadImage ("wood03.png");
  this.wood04 = loadImage ("wood04.png");
  this.boulder01 = loadImage ("boulder01.png");
  this.boulder02 = loadImage ("boulder02.png");
  this.boulder03 = loadImage ("boulder03.png");
  this.boulder04 = loadImage ("boulder04.png");
  this.woodpattern = loadImage ("woodpatch2.png");
  this.grasspattern = loadImage ("grasspatch3.png");
  this.moorpattern = loadImage ("moorpatch3.png");
  this.thick01 = loadImage ("thick01.png");
  this.thick02 = loadImage ("thick02.png");
  this.wood05 = loadImage ("wood05.png");
  this.wood06 = loadImage ("wood06.png");
  this.wood07 = loadImage ("wood07.png");
  this.wood08 = loadImage ("wood08.png");
  this.knoll01 = loadImage ("knoll01.png");
  this.knoll02 = loadImage ("knoll02.png");
  this.mine02 = loadImage ("mine02.png");
  this.pond02 = loadImage ("pond02.png");
  this.root01 = loadImage ("root01.png");
  this.root02 = loadImage ("root02.png");
  this.door01 = loadImage ("door01.png");
  this.x01 = loadImage ("x01.png");
  this.x02 = loadImage ("x02.png");
  this.x03 = loadImage ("x03.png");
  this.x04 = loadImage ("x04.png");
  this.cone01 = loadImage ("cone01.png");
  this.imWall = loadImage ("wall00.jpg");
  this.gravel = loadImage ("gravel.png");
  this.heli01 = loadImage ("heli01.png");
  this.door02 = loadImage ("door02.png");
  this.mimas01 = loadImage ("mimas01.png");
}

Scene.prototype.reset = function()
{ forest.terrain.bleak = false;
  this.doorOpen = false;
};

Scene.prototype.changeRange = function()
{ var el = document.getElementById ("range");
  this.range_m = parseInt(el.options[el.selectedIndex].value);
  this.rangeSq = this.range_m * this.range_m;
  this.checkDraw(true);
};

Scene.prototype.checkDraw = function(perhapsMap)
{ if (forest.showing === "scene")
  { var me = forest.observer;
    if (null === me.inside) this.draw();
    else me.inside.checkAndDraw();
  }
  else if (forest.showing === "map" && perhapsMap) forest.map.draw();
  refocus();
};

Scene.prototype.draw = function()
{ if (forest.sceneCache)//EX
  { forest.screen.g2.putImageData(forest.sceneCache, 0, 0);
    delete forest.sceneCache;
    return;
  }
  var t0 = new Date().getTime();// ms
  forest.screen.canvas.title = "";
  this.nDrawIms = 0;
  this.ft = forest.terrain;
  this.bleak = this.ft.bleak;
  var g2 = forest.screen.g2;
  this.g2 = g2;
  this.nAhead = 0;//ET//ZX
  var me = forest.observer;
  me.nearDoor = false;
  me.nearHeli = false;
  this.obsHt = me.ht;
  this.grassPat = this.grasspattern.loaded ? g2.createPattern(this.grasspattern, 'repeat') : null;
  this.moorPat = this.moorpattern.loaded ? g2.createPattern(this.moorpattern, 'repeat') : null;
  this.woodPat = this.woodpattern.loaded ? g2.createPattern(this.woodpattern, 'repeat') : null;
  if (forest.rain > 0) 
  { this.skyR = this.WET_R; this.skyG = this.WET_G; this.skyB = this.WET_B; g2.fillStyle = this.cssWET; }
  else if (this.bleak) 
  { this.skyR = this.BLK_R; this.skyG = this.BLK_G; this.skyB = this.BLK_B; g2.fillStyle = this.cssBLK; }
  else { this.skyR = this.SUN_R; this.skyG = this.SUN_G; this.skyB = this.SUN_B; g2.fillStyle = this.cssSUN; }
  g2.fillRect(0, 0, this.wd, this.ht);
  if (this.bleak && this.mimas01.loaded)
  { var dbM = me.b - this.bMimas;
    if (dbM < -180) dbM += 360; else if (dbM > 180) dbM -= 360;
    if (-70 < dbM && dbM < 70)
    { this.nDrawIms++; g2.drawImage(this.mimas01, this.wd2 - dbM * this.wd / 90, this.ht * 0.2);}
  }
  g2.font = "normal 32px serif";
  g2.fillStyle = "#69b";
  g2.fillText(forest.url, 8, 40);
  this.buildings = new Array(200);
  this.nBuildings = 0;
  var tr0 = this.ft.terra(me.x, me.y);
  this.ht0 = tr0.height; // At me
  me.dht = me.getHt10mAhead() - this.ht0;
  // Scan terrain & point features around me (2 * range_m + 1 square):
  var mex = Math.round(me.x);
  var mey = Math.round(me.y);
  this.sxL = this.syL = this.sxR = this.syR = 0;
  // Find points in range ahead +/-70 degrees:
  var rmBWD = this.range_m - this.BWD;
  this.fa = forest.around;
  this.fa.init(mex, mey);
  var rm1 = this.range_m - 1, furthestI = Math.floor(Math.PI * rm1 * rm1);//ET//ZX
  var buildingsBehind = []; 
  var i, sp, jx, jy;
  for (var ii = furthestI; ii >= 0; ii--)
  { var xyd = this.fa.lookupXYD(ii);
    var xScan = xyd.x + mex, xOdd = (xScan & 1 === 1);
    var yScan = xyd.y + mey, yOdd = (yScan & 1 === 1);
    var dScan = xyd.d, bScan = xyd.b;//ES
    if (dScan < 20)// More accurate://EU:
    { var dx = xScan - me.x, dy = yScan - me.y;
      dScan = Math.sqrt(dx * dx + dy * dy);
      bScan = Math.atan2(dx, dy) * RAD2DEG;
    }
    var db = bScan - me.b;
    if (db < -180) db += 360;
    else if (db > 180) db -= 360;
    sp = this.fa.aroundSet(dScan, db, xScan, yScan, xOdd && yOdd);
    if (this.doFog && forest.rain <= 0 && !this.bleak)
    { var dNr = dScan / this.range_m;
      if (dNr > 0.75) sp.fogNo = (dNr - 0.75) * 4; // 0..1
    }
    if (this.range_m - 3 > dScan)//ZX
    { if ((dScan > 30 && -50 <= db && db <= 50)
       || (-70 <= db && db <= 70))//ZX
      { this.ahead[this.nAhead] = sp; this.nAhead++; }//ET//ZX
      else if (dScan < 20) // but not ahead!
        { sp.getTerra();
          if (sp.tr.terrain === TERRAINS.TOWN && Building.prototype.atCentre(xScan, yScan))
            buildingsBehind.push (sp);
  } } }
  for (i = 0; i < buildingsBehind.length; i++)
  { sp = buildingsBehind[i];
    var bld = new Building(sp.x, sp.y);
    bld.markFoundations();
    this.buildings[this.nBuildings] = bld;
    this.nBuildings++;
    sp.building = bld; // Extra prop building
  }
  for (ii = 0; ii < this.nAhead; ii++)//ET//ZX
  { sp = this.ahead[ii];//ET//ZX
    var x = sp.x, y = sp.y;
    sp.getTerra();
    if (sp.tr.terrain === TERRAINS.TOWN && Building.prototype.atCentre(x, y) && sp.d < rmBWD)
    { var bld = new Building(x, y);
      bld.markFoundations();
      this.buildings[this.nBuildings] = bld;
      this.nBuildings++;
      sp.building = bld; // Extra prop building
    }
    if (sp.d < 20) // Need clearing? (not boulders, roots, cones)
    { var feat = sp.tr.feature;
      if (feat === FEATURES.KNOLL || feat === FEATURES.MINE
       || feat === FEATURES.WATERHOLE || feat === FEATURES.X)
      { for (jx = x - 4; jx <= x + 4; jx++)
        { for (jy = y - 4; jy <= y + 4; jy++)
          { var spj = this.fa.aroundGet(jx, jy); spj.clear = 1; }
  } } } }
  for (ii = 0; ii < this.nAhead; ii++)// Draw // ET//ZX
  { sp = this.ahead[ii];//ET//ZX
    var x = sp.x, y = sp.y, fscale = this.FSCALE / sp.d, tr = sp.tr;
    var fx, fy, fwd, fht, fim = null, gim = null;// Feature, ground images
    var sxy = this.getScreenXY(x, y);
if (!sxy) continue;//ES//ZX
    var rand = Math.round(PI10000 * x * y);// used later too
    var v8 = 0x7 & rand; // 3 bits
    var v4 = 0x3 & v8; // 2 bits
    var showTree = false;
    if (sp.o) // x, y both odd
    { if (sp.building !== undefined) sp.building.drawPart(x, y, mex, mey, this.range_m);
      else if (sp.drawn === undefined)
      if (x > mex - this.range_m && x < mex + this.range_m - 1
       && y > mey - this.range_m && y < mey + this.range_m - 1)
      { var xm1 = x - 1, xp1 = x + 1, ym1 = y - 1, yp1 = y + 1;
        var sxy00 = this.getScreenXY(xm1, ym1);
if (!sxy00) continue;//ES//ZX
        var sxy01 = this.getScreenXY(xm1, yp1);
if (!sxy01) continue;//ES//ZX
        var sxy11 = this.getScreenXY(xp1, yp1);
if (!sxy11) continue;//ES//ZX
        var sxy10 = this.getScreenXY(xp1, ym1);
if (!sxy10) continue;//ES//ZX
        // Find rect containing tile:
        var sxMaxMin = this.maxmin(sxy00.x, sxy01.x, sxy11.x, sxy10.x);
        var syMaxMin = this.maxmin(sxy00.y, sxy01.y, sxy11.y, sxy10.y);
        var sxMin = sxMaxMin.min;
        var sxMax = sxMaxMin.max;
        var syMin = syMaxMin.min;
        var syMax = syMaxMin.max;
        var marshy = Stream.prototype.isMarsh(x, y);
        switch (tr.terrain)
        {
case TERRAINS.Z: g2.fillStyle = "#005"; break;
case TERRAINS.STREAM:
case TERRAINS.LAKE: g2.fillStyle = fogRGB(68, 119, 153, sp.fogNo); break;//#479
case TERRAINS.SNOW: g2.fillStyle = fogRGB(245, 250, 255, sp.fogNo); break; // bluish white
case TERRAINS.ROAD:
if (tr.height === forest.terrain.lakeHt)//21.1.7 - bridge
{ var sxys = [sxy00, sxy01, sxy11, sxy10];
  for (var m = 0; m < 4; m++)
  { var sxym = sxys[m];
    g2.beginPath();
    g2.moveTo(sxym.x, sxym.y);
    g2.lineTo(sxym.x, sxym.y - 20 * fscale);
    g2.closePath();
    g2.strokeStyle = fogRGB(124, 78, 27, sp.fogNo);
    g2.lineWidth = 4 * fscale;
    g2.stroke();
    g2.lineWidth = 1;
} }
case TERRAINS.PATH:
case TERRAINS.TOWN: g2.fillStyle = fogRGB(119, 119, 119, sp.fogNo); break;//#777
case TERRAINS.MUD: g2.fillStyle = fogRGB(92, 39, 14, sp.fogNo); break;//RA
case TERRAINS.GRASS: if (sp.clear !== undefined) break;
g2.fillStyle = (0 === sp.fogNo && null !== this.grassPat) ? this.grassPat : fogRGB(112, 145, 88, sp.fogNo);//#709158
if (marshy) gim = this.marshpatch; else
            if (this.grasspatch.loaded) gim = this.grasspatch; 
            break;
case TERRAINS.MOOR: if (sp.clear !== undefined) break;
g2.fillStyle = (0 === sp.fogNo && null !== this.moorPat) ? this.moorPat : fogRGB(142, 105, 83, sp.fogNo);//#8e6953 
if (marshy) gim = this.marshpatch; else
            if (this.moorpatch.loaded) gim = this.moorpatch; 
            break;
case TERRAINS.WOOD: 
g2.fillStyle = (0 === sp.fogNo && null !== this.woodPat) ? this.woodPat : fogRGB(178, 151, 100, sp.fogNo);//#b29764
if (marshy)
{ gim = this.marshpatch;
  showTree = false;
}
else
{
            if (sp.clear === undefined)
            { fim = this.selectTree(v8);
              showTree = (null !== fim);
            } 
            if (this.woodpatch.loaded) gim = this.woodpatch; 
};
            break;
case TERRAINS.THICKET: 
g2.fillStyle = (0 === sp.fogNo && null !== this.woodPat) ? this.woodPat : fogRGB(178, 151, 100, sp.fogNo);//#b29764
if (marshy)
{ gim = this.marshpatch;
  showTree = false;
}
else
{
            switch (v4)
            {
case 0:
case 1: if (this.thick02.loaded) fim = this.thick02; break;
case 2:
case 3: if (this.thick01.loaded) fim = this.thick01; break;
            }
            showTree = true;
            if (this.woodpatch.loaded) gim = this.woodpatch;
};
            break;
        }
        g2.beginPath(); // Tile
        g2.moveTo(sxy00.x, sxy00.y);
        g2.lineTo(sxy01.x, sxy01.y);
        g2.lineTo(sxy11.x, sxy11.y);
        g2.lineTo(sxy10.x, sxy10.y);
        if (this.clipping)
        { if (tr.terrain === TERRAINS.TOWN || tr.terrain === TERRAINS.MUD || this.bleak)
          { g2.closePath(); g2.fill();
            g2.strokeStyle = fogRGB(85, 85, 85, sp.fogNo); g2.stroke(); //"#555"
          }
          else if (null !== gim) 
          { g2.closePath(); g2.fill();
            g2.save();
            g2.beginPath(); // Tile
            g2.moveTo(sxy00.x, sxy00.y);
            g2.lineTo(sxy01.x, sxy01.y);
            g2.lineTo(sxy11.x, sxy11.y);
            g2.lineTo(sxy10.x, sxy10.y);
            g2.clip();
            this.nDrawIms++; this.drawImage(gim, sxMin - 16 * fscale, syMin - 16 * fscale, 
              sxMax - sxMin + 32 * fscale, syMax - syMin + 32 * fscale, sp.fogNo);
            g2.restore();
          }
          else
          { g2.closePath(); g2.fill();
            g2.strokeStyle = g2.fillStyle; g2.stroke();
        } }
        else // not clipping
        { g2.closePath();
          g2.fill();
          if (tr.terrain === TERRAINS.TOWN || tr.terrain === TERRAINS.MUD || this.bleak)
          { g2.strokeStyle = fogRGB(85, 85, 85, sp.fogNo); g2.stroke(); }//"#555"
          else
          { g2.strokeStyle = g2.fillStyle; g2.stroke();
            if (null !== gim) { this.nDrawIms++; this.drawImage(gim, sxMin - 8 * fscale, syMin, 
              sxMax - sxMin + 16 * fscale, syMax - syMin + 8 * fscale, sp.fogNo);}
        } }
//EK: Smooth lake and road edges:
// sxy01 - sxy11
//   |       |
// sxy00 - sxy10
if (sp.d < 60)
{ var tt = tr.terrain;
  if (tt === TERRAINS.LAKE || tt === TERRAINS.ROAD || tt === TERRAINS.PATH || tt === TERRAINS.STREAM)
  { var xp2 = x + 2, xm2 = x - 2, yp2 = y + 2, ym2 = y - 2,
    fa = forest.around, aN = fa.aroundGet(x, yp2), aNE = fa.aroundGet(xp2, yp2),
    aE = fa.aroundGet(xp2, y), aSE = fa.aroundGet(xp2, ym2), aS = fa.aroundGet(x, ym2),
    aSW = fa.aroundGet(xm2, ym2), aW = fa.aroundGet(xm2, y), aNW = fa.aroundGet(xm2, yp2);
if (this.neighb3(aN, aNE, aE, tt)) fillTriangle(g2, sxy01.x, sxy01.y, sxy11.x, sxy11.y, sxy10.x, sxy10.y);
if (this.neighb3(aE, aSE, aS, tt)) fillTriangle(g2, sxy11.x, sxy11.y, sxy10.x, sxy10.y, sxy00.x, sxy00.y);
if (this.neighb3(aS, aSW, aW, tt)) fillTriangle(g2, sxy10.x, sxy10.y, sxy00.x, sxy00.y, sxy01.x, sxy01.y);
if (this.neighb3(aW, aNW, aN, tt)) fillTriangle(g2, sxy00.x, sxy00.y, sxy01.x, sxy01.y, sxy11.x, sxy11.y);
} }
//:EK
        if (null !== fim) // Terrain image
        { if (showTree)
          { var sxyOff = this.getOffsetScreenXY(x, y); // Don't change sxy!
            if (null === sxyOff) fim = null;
            else
            { var fscaleOff = this.FSCALE / sxyOff.d;
              fwd = fim.width * fscaleOff;
              fx = sxyOff.x - fwd * 0.5;
              if (fx >= this.wd || fx <= -fwd) fim = null;
              else
              { fht = fim.height * fscaleOff;
                fy = sxyOff.y - fht;
          } } }
          else
          { fwd = fim.width * fscale;
            fx = sxy.x - fwd * 0.5;
            if (fx >= this.wd || fx <= -fwd) fim = null;
            else
            { fht = fim.height * fscale;
              fy = sxy.y - fht;
          } }
          if (null !== fim) { this.nDrawIms++; this.drawImage(fim, fx, fy, fwd, fht, sp.fogNo);} 
    } } }
    fim = null;
    switch (tr.feature)
    {
    case FEATURES.KNOLL:
      switch (v4)
      {
case 0:
case 1: if (this.knoll02.loaded) fim = this.knoll02; break;
case 2:
case 3: if (this.knoll01.loaded) fim = this.knoll01; break;
      }
      break;
    case FEATURES.MINE:
      if (sp.d < 4 && !me.inHeli && null === forest.fwdTimerId) 
      { enterMine(true); break; }
      if (sp.d < 20) this.completeClearing(x, y, tr, fscale);
      if (this.mine02.loaded) 
      { fim = this.mine02; sxy.y += fim.height * fscale * 0.5; }
      break;
    case FEATURES.WATERHOLE:
      if (sp.d < 20) this.completeClearing(x, y, tr, fscale);
      if (this.pond02.loaded) { fim = this.pond02; sxy.y += fim.height * fscale * 0.5; }
      break;
    case FEATURES.ROOT:
      switch (v4)
      {
case 0:
case 1: if (this.root01.loaded) fim = this.root01; break;
case 2:
case 3: if (this.root02.loaded) fim = this.root02; break;
      }
      break;
    case FEATURES.BOULDER:
      switch (v4)
      {
case 0: if (this.boulder01.loaded) fim = this.boulder01; break;
case 1: if (this.boulder02.loaded) fim = this.boulder02; break;
case 2: if (this.boulder03.loaded) fim = this.boulder03; break;
case 3: if (this.boulder04.loaded) fim = this.boulder04; break;
      }
      break;
    case FEATURES.X:
      if (TERRAINS.GRASS === tr.terrain || TERRAINS.MOOR === tr.terrain)
      { if (v4 === 1)
        { if (this.doorOpen)
          { if (this.door02.loaded) 
            { fim = this.door02;
              if (sp.d <= 2) forest.terrain.bleak = true;
          } }
          else
          { if (this.door01.loaded) 
            { fim = this.door01;
              if (sp.d <= 7) me.nearDoor = true;
          } }
          break;
        }
        else if (this.x03.loaded) fim = this.x03;
      }
      else
      switch (v4)
      {
case 0: if (this.x01.loaded) fim = this.x01; break;
case 1:
case 2: if (this.x02.loaded) fim = this.x02; break;
case 3: if (this.x04.loaded) fim = this.x04; break;
      }
      break;
    case FEATURES.CONE:
      if (this.cone01.loaded) fim = this.cone01;
      if (me.role !== ROLES.GANGSTER) 
      { if (coneIsHeli(tr.terrain))//RA
        { if (!me.inHeli && this.heli01.loaded)
          { fim = this.heli01; if (sp.d <= 7) me.nearHeli = true; }
        }
      } 
      break;
    case FEATURES.T: 
      if (forest.tele.ims[0].loaded) 
      { fim = forest.tele.ims[0];
        if (sp.d <= 7)
        { me.spTele = sp;
          me.spTele.fscale = fscale;
          me.spTele.sxy = sxy;
      } }
      break;
    }
    if (null !== fim) // Feature image
    { fwd = fim.width * fscale;
      fht = fim.height * fscale;
      fx = sxy.x - fwd / 2;
      fy = sxy.y - fht;
      this.nDrawIms++; this.drawImage(fim, fx, fy, fwd, fht, sp.fogNo); // Scaled
    }
  }
  if (forest.rain > 0) this.drawRain();
if (!me.inHeli)
{ var spl, spx;
  if (tr0.terrain === TERRAINS.LAKE)
  { if (me.swimming)
    { spl = "SWIMMING TO SHORE"; spx = 200; }
    else if (tr0.depth > 20) 
    { spl = "OUT OF YOUR DEPTH! SWIM!"; 
      spx = 100;
      me.b = (me.b + 180) % 360;
      me.sincos();
      me.swimming = true;
      this.reset();
    }
    else
    { spl = "SPLASH!";
      var r = Math.random();
      if (r > 0.7) spl = "SPLOSH!";
      else if (r > 0.35) spl = "SPLISH!";
      spx = this.wd2 - 100;
    }
    this.exclaim(spl, spx, this.ht / 3, '#fff', '#00f');
  }
  else if (tr0.terrain === TERRAINS.THICKET)
  { me.swimming = false;
    this.exclaim("OUCH!", this.wd2 - 70, this.ht / 6, '#fff', '#080');
  }
  else me.swimming = false;
  if (Stream.prototype.isMarsh(mex, mey))
  { this.exclaim("SQUELCH!", this.wd2 - 100, this.ht / 6, '#fff', '#080'); }
} // Level markers:
  g2.beginPath();
  g2.moveTo(0, this.htBase);
  g2.lineTo(20, this.htBase);
  g2.stroke();
  g2.moveTo(this.wd - 1, this.htBase);
  g2.lineTo(this.wd - 21, this.htBase);
  g2.strokeStyle = "#fff";
  g2.lineWidth = 5;
  g2.stroke();
  g2.strokeStyle = "#000";
  g2.lineWidth = 1;
  g2.stroke();
  if (me.inHeli) this.drawHeliControls(g2);//EX
  me.drawCompass();
if (null !== me.spTele)
{ var dx = me.x - me.spTele.x, dy = me.y - me.spTele.y;
  if (dx * dx + dy * dy > 49) me.spTele = null;
}
  var dt = new Date().getTime() - t0; // ms
  forest.infoDiv.innerHTML = me.toString() + ", Drawn in " + dt + "ms (" + this.nDrawIms + " images)";
  this.drawingTimes += dt + '<br>';
};

Scene.prototype.exclaim = function(txt, sx, sy, fill, stroke)
{ this.g2.font = "bold 40px Verdana,sans-serif";
  this.g2.fillStyle = fill;
  this.g2.fillText(txt, sx, sy);
  this.g2.strokeStyle = stroke;
  this.g2.strokeText(txt, sx, sy);
};

Scene.prototype.selectTree = function(v8)
{ switch (v8)
  {
case 7: if (this.wood08.loaded) return this.wood08;
case 6: if (this.wood07.loaded) return this.wood07;
case 5: if (this.wood06.loaded) return this.wood06;
case 4: if (this.wood05.loaded) return this.wood05;
case 3: if (this.wood03.loaded) return this.wood03;
case 2: if (this.wood01.loaded) return this.wood01;
case 1: if (this.wood02.loaded) return this.wood02;
case 0: if (this.wood04.loaded) return this.wood04;
  }
  return null;
};

//EK:
Scene.prototype.neighb3 = function(a1, a2, a3, tt)
{ var n1 = this.neighb(a1, tt);
  if (n1)
  { var n2 = this.neighb(a2, tt);
    if (n2)
    { var n3 = this.neighb(a3, tt);
      if (n3)
      { this.g2.fillStyle = (n1 === n2 && n2 === n3) ? n1 : this.cssMUD;
        return true;
  } } }
  return false;  
};

Scene.prototype.neighb = function(a, tt)
{ if (a.tr && a.tr.terrain && a.tr.terrain !== tt)
  { switch (a.tr.terrain)
    {
case TERRAINS.THICKET:
case TERRAINS.WOOD: return this.woodPat;
case TERRAINS.GRASS: return this.grassPat;
case TERRAINS.MOOR: return this.moorPat;
case TERRAINS.TOWN: return '#777';
    }
    return this.cssMUD;
  }
  return false;
};
//:EK

// Draw all tiles in a clearing before the feature
Scene.prototype.completeClearing = function(x, y, tr, fscale)
{ var gim = null;
  var g2 = this.g2;
  var d0 = this.fa.aroundGet(x, y).d;// Centre = feature
  for (var jx = x - 3; jx <= x + 3; jx++)
  { for (var jy = y - 3; jy <= y + 3; jy++)
    { var sp = this.fa.aroundGet(jx, jy);
      if (sp.o && sp.d <= d0)
      { // Draw tile & mark done
        var xm1 = jx - 1, xp1 = jx + 1, ym1 = jy - 1, yp1 = jy + 1;
        var sxy00 = this.getScreenXY(xm1, ym1);
if (!sxy00) continue;//ES//ZX
        var sxy01 = this.getScreenXY(xm1, yp1);
if (!sxy01) continue;//ES//ZX
        var sxy11 = this.getScreenXY(xp1, yp1);
if (!sxy11) continue;//ES//ZX
        var sxy10 = this.getScreenXY(xp1, ym1);
if (!sxy10) continue;//ES//ZX
        // Find rect containing tile
        var sxMaxMin = this.maxmin(sxy00.x, sxy01.x, sxy11.x, sxy10.x);
        var syMaxMin = this.maxmin(sxy00.y, sxy01.y, sxy11.y, sxy10.y);
        var sxMin = sxMaxMin.min;
        var sxMax = sxMaxMin.max;
        var syMin = syMaxMin.min;
        var syMax = syMaxMin.max;
        switch (tr.terrain)
        {
        case TERRAINS.LAKE: g2.fillStyle = fogRGB(68, 119, 153, sp.fogNo); break;//#479
        case TERRAINS.ROAD:
        case TERRAINS.TOWN: g2.fillStyle = fogRGB(119, 119, 119, sp.fogNo); break;//#777
        case TERRAINS.GRASS: 
          g2.fillStyle = (0 === sp.fogNo && null !== this.grassPat) ? this.grassPat : fogRGB(112, 145, 88, sp.fogNo);//#709158
          if (this.grasspatch.loaded) gim = this.grasspatch;
          break;
        case TERRAINS.MOOR: 
          g2.fillStyle = (0 === sp.fogNo && null !== this.moorPat) ? this.moorPat : fogRGB(142, 105, 83, sp.fogNo);//#8e6953
          if (this.moorpatch.loaded) gim = this.moorpatch;
          break;
        case TERRAINS.WOOD: 
        case TERRAINS.THICKET: 
          g2.fillStyle = (0 === sp.fogNo && null !== this.woodPat) ? this.woodPat : fogRGB(178, 151, 100, sp.fogNo);//#b29764
          if (this.woodpatch.loaded) gim = this.woodpatch;
          break;
        }
        g2.beginPath(); // Tile
        g2.moveTo(sxy00.x, sxy00.y);
        g2.lineTo(sxy01.x, sxy01.y);
        g2.lineTo(sxy11.x, sxy11.y);
        g2.lineTo(sxy10.x, sxy10.y);
        g2.closePath();
        g2.fill();
        g2.strokeStyle = g2.fillStyle;
        g2.stroke();
        if (null !== gim) { this.nDrawIms++; g2.drawImage(gim, sxMin - 8 * fscale, syMin, 
              sxMax - sxMin + 16 * fscale, syMax - syMin + 8 * fscale);}
        var sps = this.fa.aroundGet(jx, jy); sps.drawn = 1;
  } } }
};

Scene.prototype.getScreenXY = function(x, y)
{ var sp = this.fa.aroundGet(x, y);
  if (sp.x === 0 && sp.y === 0) return null;//ET//ZX
  var ht = sp.getTerra().height;//ZX
  var sinb, cosb;
  var brad = sp.b * DEG2RAD; sinb = Math.sin(brad); cosb = Math.cos(brad);
  var zz = sp.d * cosb;
if (zz < 1) zz = 1;
  var fRatio = this.FF / zz;
  var sx = fRatio * sp.d * sinb + this.wd2; // Relative to screen centre, wd2
  var sy = this.htBase - fRatio * ((ht - this.ht0) * this.YSCALE - this.obsHt);
  return {x:sx, y:sy};
};

Scene.prototype.getOffsetScreenXY = function(x, y)
{ // Repeatably random offset for trees:
  var pixy = PI10000 * x * y;
  var off = (pixy - Math.floor(pixy)) * 2 - 1;
  var xOff = x + off, yOff = y + off;
  var me = forest.observer;
  var dx = xOff - me.x, dy = yOff - me.y;
  var b = Math.atan2(dx, dy) * RAD2DEG;
  var db = b - me.b;
  if (db < -180) db += 360; else if (db > 180) db -= 360;
  if (db < -70 || db > 70) return null;
  var d = Math.sqrt(dx * dx + dy * dy);
  if (d < 1) return null;
  var ht = this.ft.terra(xOff, yOff).height;
  var sinb, cosb;
  var brad = db * DEG2RAD; sinb = Math.sin(brad); cosb = Math.cos(brad);
  var zz = d * cosb;
if (zz < 1) zz = 1;
  var fRatio = this.FF / zz;
  var sx = fRatio * d * sinb + this.wd2;
  var sy = this.htBase - fRatio * ((ht - this.ht0) * this.YSCALE - this.obsHt);
if (sy <= 0) return null;//ZX
  return {x:sx, y:sy, d:d};
};

Scene.prototype.maxmin = function(a1, a2, a3, a4)
{ var max = a1, min = a1;
  if (a2 > max) max = a2; else min = a2;
  if (a3 > max) max = a3; else if (a3 < min) min = a3;
  if (a4 > max) max = a4; else if (a4 < min) min = a4;
  return {max: max, min: min};
};

Scene.prototype.drawRain = function()
{ var x, y, dx = -4, dy = 32, grey = 192, g2 = this.g2;
  g2.lineWidth = 2;
  for (var i = 0; i < 1000; i++)
  { g2.strokeStyle = makeCssColour(grey, grey, grey);
    g2.beginPath();
    x = Math.random() * this.wd;
    y = Math.random() * this.ht;
    g2.moveTo(x, y);
    g2.lineTo(x + dx, y + dy);
    g2.stroke();
    dy += 2 * Math.random() - 1;
    grey += 8 * Math.random() - 4;
    if (grey > 255) grey = 255; else if (grey < 128) grey = 128;
  }
  g2.lineWidth = 1;
};

Scene.prototype.lookUp = function() { if (this.htBase < this.ht) { this.htBase += 50; this.draw(); } };
Scene.prototype.lookLevel = function(){ this.htBase = Math.floor (this.ht * 0.6); this.draw(); };
Scene.prototype.lookDown = function() { if (this.htBase > 0) { this.htBase -= 50; this.draw(); } };
Scene.prototype.openDoor = function() { this.doorOpen = true; this.draw(); };
Scene.prototype.setButtons = function() { showButtons(sceneButtons); };

function fog(c, f) // c = '#xxx' or '#xxxxxx', f = fogNo, 0..1
{ if (f === 0 || !forest.scene.doFog) return c;
  var s, r, g, b;
  if (c.length === 4)
  { s = c.charAt(1); r = parseInt('' + s + s, 16);
    s = c.charAt(2); g = parseInt('' + s + s, 16);
    s = c.charAt(3); b = parseInt('' + s + s, 16);
  } else // length 7
  { r = parseInt(c.substring(1, 3), 16);
    g = parseInt(c.substring(3, 5), 16);
    b = parseInt(c.substring(5), 16);
  }
  r += (forest.scene.skyR - r) * f;
  g += (forest.scene.skyG - g) * f;
  b += (forest.scene.skyB - b) * f;
  return makeCssColour(Math.floor(r), Math.floor(g), Math.floor(b));  
}

function fogRGB(r, g, b, f)// f=fogNo, 0..1
{ r += (forest.scene.skyR - r) * f;
  g += (forest.scene.skyG - g) * f;
  b += (forest.scene.skyB - b) * f;
  return makeCssColour(Math.floor(r), Math.floor(g), Math.floor(b));  
}

function makeCssColour(r, g, b) // each 0..255
{ var rs = r.toString(16), gs = g.toString(16), bs = b.toString(16);
  if (r < 16) rs = '0' + rs;
  if (g < 16) gs = '0' + gs;
  if (b < 16) bs = '0' + bs;
  return '#' + rs + gs + bs; 
}

Scene.prototype.drawImage = function(im, x, y, wd, ht, fogNo) // fogNo 0..1
{ x |= 0; y |= 0;
  if (0 === fogNo || !this.doFog) this.g2.drawImage(im, x, y, wd, ht); // unfogged
  else
  { var fogged, iFogNo = Math.round(fogNo * 7);
    if (undefined === im.foggy[iFogNo]) // Fogged version not yet created, create it now:
    { var cnv = document.createElement('canvas');
      cnv.width = im.width;
      cnv.height = im.height;
      var g2 = cnv.getContext('2d');
      g2.drawImage(im, 0, 0); // Full size
      var imData = g2.getImageData(0, 0, im.width, im.height);
      var px = imData.data;
      for (var i = 0; i < px.length; i++)
      { var i3 = i + 3;
        if (0 === px[i3]) i = i3; // skip transparent px
        else
        { px[i] += (this.skyR - px[i]) * fogNo; i++;
          px[i] += (this.skyG - px[i]) * fogNo; i++;
          px[i] += (this.skyB - px[i]) * fogNo; i++;
      } } // loop inc skips alpha
      g2.putImageData(imData, 0, 0);
      fogged = new Image();
      fogged.onload = function() { fogged.loaded = true; };
      fogged.src = cnv.toDataURL('image/png'); // Get result as an Image
      im.foggy[iFogNo] = fogged;
    } // Do not draw - may take time to load. It'll be missing from scene for now
    else
    { fogged = im.foggy[iFogNo];
      if (fogged.loaded) this.g2.drawImage(fogged, x, y, wd, ht);
} } };

function coneIsHeli(terrain)
{ return (TERRAINS.GRASS === terrain || TERRAINS.MOOR === terrain); }

function HeliButton(xL, yT, xR, yB, text, keyText, func)
{ this.xL = xL; this.yT = yT;// Left Top
  this.xR = xR; this.yB = yB;// Right Bottom
  this.wd = xR - xL; this.ht = yB - yT;
  this.text = text;
  this.key = keyText;
  this.func = func;
}

HeliButton.prototype.draw = function(g2)
{ g2.font = "normal 32px sans-serif";
  g2.strokeStyle = g2.fillStyle = "#f00";
  g2.lineWidth = 3;
  g2.strokeRect(this.xL, this.yT, this.wd, this.ht);
  g2.lineWidth = 1;
  if (this.text.length > 0) g2.fillText(this.text, this.xL + 7, this.yT + 35);
  if (this.key.length > 0)
  { g2.font = "bold 12px sans-serif";
    g2.fillStyle = "#444";
    g2.fillText(this.key, this.xL + 12, this.yB - 12);
} };

HeliButton.prototype.isIn = function(x, y)
{ return (x > this.xL && x < this.xR && y > this.yT && y < this.yB); };

Scene.prototype.createHeliButtons = function()
{ var fs = forest.screen, wd = fs.wd, ht = fs.ht;
  var compHt = forest.observer.COMPASS_RADIUS_PX * 2;
  var yT = ht - compHt * 0.9, yB = ht - compHt * 0.1;
  this.heliButtons = 
  { up:new HeliButton(wd * 0.1, yT, wd * 0.18, yB, "UP", "PgUp", heliUp),
  down:new HeliButton(wd * 0.35, yT, wd * 0.43, yB, "DN", "PgDn", heliDown),
  exit:new HeliButton(wd * 0.6, yT, wd * 0.9, yB, "   Disembark", "        Esc", heliExit),
 blank:new HeliButton(wd * 0.6, yT, wd * 0.9, yB, "", "", null)
  };
};

Scene.prototype.drawHeliControls = function(g2)
{ var me = forest.observer, compHt = me.COMPASS_RADIUS_PX * 2;
  g2.fillStyle = "#9999";//RGBA
  g2.beginPath();
  g2.moveTo(0, this.ht);
  g2.lineTo(compHt, this.ht - compHt);
  g2.lineTo(this.wd - compHt, this.ht - compHt);
  g2.lineTo(this.wd, this.ht);
  g2.closePath();
  g2.fill();
  g2.strokeStyle = g2.fillStyle = "#f00";
  g2.fillText("Altitude", this.wd * 0.2, this.ht - compHt + 30);
  var alti = (me.ht > me.ME_HT) ? me.ht.toFixed(0) : 0;
  g2.fillText(alti + "m", this.wd * 0.22, this.ht - 15);
  this.heliButtons.up.draw(g2);
  this.heliButtons.down.draw(g2);
  if (alti > 0) this.heliButtons.blank.draw(g2);
  else this.heliButtons.exit.draw(g2);
};