// Part of The Forest
// Copyright (c) Graham Relf, UK, 2021-24
// www.grelf.net
'use strict';

function Tele ()
{ this.sites = // sx etc define mouse target on board in tele box
  [ {x:17401, y:8210, id:'0', sx:380, sy:340, wd:48, ht:32},
    {x:16985, y:11599, id:'A', sx:328, sy:34, wd:48, ht:32},
    {x:15136, y:8710, id:'B', sx:293, sy:126, wd:48, ht:32},
    {x:14095, y:7790, id:'C', sx:45, sy:221, wd:48, ht:32},
    {x:13235, y:6850, id:'D', sx:67, sy:318, wd:48, ht:32},
    {x:14929, y:5129, id:'E', sx:171, sy:394, wd:48, ht:32},
    {x:17316, y:2728, id:'F', sx:389, sy:535, wd:48, ht:32},
    {x:19280, y:4205, id:'G', sx:674, sy:491, wd:48, ht:32}
  ];
  const DMETAL =
  [ {dx:0, dy:16},
    {dx:16, dy:16},
    {dx:16, dy:0},
    {dx:16, dy:-16},
    {dx:0, dy:-16},
    {dx:-16, dy:-16},
    {dx:-16, dy:0},
    {dx:-16, dy:16}
  ];
  forest.observer.spTele = null;
  this.ims = [];
  for (let i = 0; i < 10; i++) this.ims.push(loadImage("teleN" + i + "0.png"));
  this.board = loadImage("teleBoard_800x600.png");
  let ft = forest.terrain;
  for (let i = 0; i < this.sites.length; i++)
  { let si = this.sites[i];
    let xy = ft.findGoodSite(si.x, si.y);
    si.x = Math.round(xy.x);
    si.y = Math.round(xy.y);
    let k = 0, ok = false;
    do
    { let dmk = DMETAL[k];
      si.mx = si.x + dmk.dx;
      si.my = si.y + dmk.dy;
      let tr = ft.terra(si.mx, si.my), tt = tr.terrain;
      if (tr.height - ft.lakeHt > 10 && tr.feature === FEATURES.NONE
       && (tt === TERRAINS.WOOD) || (tt === TERRAINS.GRASS || tt === TERRAINS.MOOR))
      { ok = true;
      }
      else
      { k++;
        if (k > 7) ok = true;// Give up
    } }
    while (!ok);
  }
  //Placing later in case findGoodSite wiped out this area
  for (let i = 0; i < this.sites.length; i++)
  { let si = this.sites[i];
    ft.place(si.x, si.y, FEATURES.T);
    ft.place(si.mx, si.my, FEATURES.METAL);
} }

function nearestPhone()
{ let me = forest.observer, mePt = new Point(me.x, me.y);
  let dMin = 1e8, bMin = 0, fts = forest.tele.sites;
  for (let i = 0; i < fts.length; i++)
  { let si = fts[i];
    let db = mePt.distanceAndBearing(si);
    if (db.d < dMin)
    { dMin = db.d; bMin = db.b;
  } }
  message("The nearest phone is",
dMin.toFixed(0) + "m away on a bearing of",
(bMin * RAD2DEG).toFixed(0) + " degrees", true);
}

function teleClick(mousePt)
{ var fts = forest.tele.sites, x = mousePt.x, y = mousePt.y;
  for (var i = 0; i < fts.length; i++)
  { var si = fts [i];
    if (x >= si.sx && x <= si.sx + si.wd && y >= si.sy && y <= si.sy + si.ht)
    { goTele (si.id);
      return;
} } }

function enterTele()
{ var spT = forest.observer.spTele;
  if (!spT) return;
  forest.lockedUI = true;
  forest.screen.g2.save();
  var im = forest.tele.ims[0];
  var imwd = im.width * spT.fscale, imwd2 = imwd / 2;
  var imht = im.height * spT.fscale;
  var x = spT.sxy.x - imwd2;
  var y = spT.sxy.y - imht;
  forest.animData = {i:0, spT:spT, wd:imwd, wd2:imwd2, ht:imht, ht2:imht / 2, sx:x, sy:y};
  openTele();
}

function openTele()
{ var fad = forest.animData;
  var im = forest.tele.ims[fad.i];
  forest.scene.drawImage(im, fad.sx, fad.sy, fad.wd, fad.ht, fad.spT.fogNo);
  if (fad.i < 9)
  { fad.i++;
    setTimeout(openTele, 250);
  }
  else
  { var zoomIm = new Image();
    zoomIm.onload = function() 
    { var fad = forest.animData, fs = forest.screen;
      fad.xC = fad.sx + fad.wd2, fad.yC = fad.sy + fad.ht * 0.35; // Image centre
      fad.wd = fs.wd; fad.ht = fs.ht;
      var wd2 = fs.wd / 2, ht2 = fs.ht / 2;
      if (fad.xC < 0 || fad.xC > fs.wd || fad.yC < 0 || fad.yC > fs.ht)
      { fad.xC = wd2; fad.yC = ht2; }
      fad.xOff = fad.xC; fad.yOff = fad.yC; // Change differently
      fad.i = 0;
      fad.NSTEPS = 10;
      fad.dx = (wd2 - fad.xC) / fad.NSTEPS;
      fad.dy = (ht2 - fad.yC) / fad.NSTEPS;
      fad.SCALE = 1.2;
      fad.im = zoomIm;
      zoomTele();
    };
    zoomIm.src = forest.screen.canvas.toDataURL('image/png');
} }

function zoomTele()
{ var fad = forest.animData, g2 = forest.screen.g2;
  fad.xC += fad.dx; fad.yC += fad.dy;
  fad.xOff *= fad.SCALE; fad.yOff *= fad.SCALE;
  fad.wd *= fad.SCALE; fad.ht *= fad.SCALE;
  g2.drawImage(fad.im, fad.xC - fad.xOff, fad.yC - fad.yOff, fad.wd, fad.ht);
  fad.i++;
  if (fad.i < fad.NSTEPS) setTimeout(zoomTele, 200);
  else
  { g2.drawImage(forest.tele.board, 0, 0, 800, 600);
    document.getElementById("sideButtons").innerHTML = "";
    showButtons(teleButtons);
    forest.showing = "tele";
    forest.lockedUI = false;
} }

function go0() { goTele("0"); }
function goA() { goTele("A"); }
function goB() { goTele("B"); }
function goC() { goTele("C"); }
function goD() { goTele("D"); }
function goE() { goTele("E"); }
function goF() { goTele("F"); }
function goG() { goTele("G"); }

function goTele(id)
{ var ft = forest.tele;
  forest.observer.spTele = null;
  let j = getNearestTeleNo();
  for (var i = 0; i < ft.sites.length; i++)
  { if (ft.sites [i].id === id) 
    { if (i === j) return;//Not to same tele
      forest.lockedUI = true;
      forest.animData = new TeleMachine(i);
      teleport();
      return; 
  } }
  message ("ERROR", "Tele id not found", true);
}

function getNearestTeleNo()
{ let me = forest.observer, ft = forest.tele;
  let minD2 = 1e20, minI = 0;
  for (let i = 0; i < ft.sites.length; i++)
  { let si = ft.sites[i];
    let dx = si.x - me.x, dy = si.y - me.y;
    let d2 = dx * dx + dy * dy;
    if (d2 < minD2)
    { minD2 = d2;
      minI = i;
  } }
  return minI;
}

const teleButtons = [
{ kind:'small', id:"0", text:"0", key:"0", func:go0 },
{ kind:'small', id:"a", text:"A", key:"a", func:goA },
{ kind:'small', id:"b", text:"B", key:"b", func:goB },
{ kind:'small', id:"c", text:"C", key:"c", func:goC },
{ kind:'small', id:"d", text:"D", key:"d", func:goD },
{ kind:'small', id:"e", text:"E", key:"e", func:goE },
{ kind:'small', id:"f", text:"F", key:"f", func:goF },
{ kind:'small', id:"g", text:"G", key:"g", func:goG },
{ kind:'side', id:"exit", text:"Exit", key:"x", func:toScene }
];

function TeleMachine(destIndex)
{ this.desti = destIndex;
  this.vertical = (Math.random() >= 0.5);
  this.tele = forest.tele.ims[0];
  this.rgb = [200, 200, 200];
  this.rgbUp = [false, false, false];
  this.styles = [];
  for (var i = 0; i < 16; i++) this.styles.push(this.modRGB ());
  this.count = 150;
  this.MS_WAIT = 80;
  var fs = forest.screen;
  this.wd = fs.wd; this.wd1 = fs.wd / 4; this.wd2 = fs.wd / 2; this.wd3 = this.wd1 + this.wd2;
  this.ht = fs.ht; this.ht1 = fs.ht / 4; this.ht2 = fs.ht / 2; this.ht3 = this.ht1 + this.ht2;
}

TeleMachine.prototype.modRGB = function()
{ for (var i = 0; i < 3; i++)
  { var dd = (Math.random() * PI10000) & 0x17;
    if (this.rgbUp[i])
    { if (this.rgb[i] + dd < 256) this.rgb[i] += dd; 
      else { this.rgb[i] -= dd; this.rgbUp[i] = false; }
    }
    else
    { if (this.rgb[i] - dd >= 0) this.rgb[i] -= dd; 
      else { this.rgb[i] += dd; this.rgbUp[i] = true; }
  } }
  return makeCssColour(this.rgb[0], this.rgb[1], this.rgb[2]);
};

function teleport()
{ var fad = forest.animData, g2 = forest.screen.g2, xg, yg;
  document.getElementById("sideButtons").innerHTML = "";
  forest.buttonsDiv.innerHTML = "Sending you to " + forest.tele.sites[fad.desti].id + ". Enjoy the ride...";
  if (fad.vertical) { xg = fad.wd; yg = 0; }
  else { xg = 0; yg = fad.ht; }
  var gradient = g2.createLinearGradient(0, 0, xg, yg);
  var len = fad.styles.length, dx = 0.5 / len;
  for (var i = 0; i < len; i++)
  { var idx = i * dx, fmsi = fad.styles [i];
    gradient.addColorStop(0.5 + idx, fmsi);
    gradient.addColorStop(0.5 - idx, fmsi);
  }
  for (i = len - 1; i >= 1; i--) fad.styles[i] = fad.styles[i - 1];
  fad.styles[0] = fad.modRGB();
  g2.fillStyle = gradient;
  g2.fillRect(0, 0, fad.wd, fad.ht);
  g2.strokeStyle = '#000';
  var lw = (fad.vertical ? fad.wd : fad.ht) / fad.count;
  g2.lineWidth = lw;
  g2.fillStyle = '#000';
  if (fad.vertical)
  { fillTriangle(g2, 0, 0, fad.wd, 0, fad.wd2, fad.ht1);
    fillTriangle(g2, 0, fad.ht, fad.wd, fad.ht, fad.wd2, fad.ht3);
    strokeLine(g2, fad.wd2, 0, fad.wd2, fad.ht);
  }
  else
  { fillTriangle(g2, 0, 0, 0, fad.ht, fad.wd1, fad.ht2);
    fillTriangle(g2, fad.wd, 0, fad.wd, fad.ht, fad.wd3, fad.ht2);  
    strokeLine(g2, 0, fad.ht2, fad.wd, fad.ht2);
  }
  if (lw > 4 && fad.tele.loaded)
  { if (lw >= fad.tele.width) g2.drawImage(fad.tele, fad.wd2 - fad.tele.width / 2, fad.ht2 - fad.tele.height / 2);
    else
    { var scale = lw / fad.tele.width, scaleHt = scale * fad.tele.height;
      g2.drawImage (fad.tele, fad.wd2 - lw / 2, fad.ht2 - scaleHt / 2, lw, scaleHt);
  } }
  if (fad.count > 0) { fad.count--; setTimeout(teleport, fad.MS_WAIT); }
  else
  { var me = forest.observer, ftsi = forest.tele.sites[fad.desti];
    var xy = forest.terrain.findGoodSitePart2(ftsi.x - 8, ftsi.y, false);
    me.x = xy.x; me.y = xy.y;
    me.b = 90;
    me.sincos();
    g2.restore();
    forest.map.centre = {x: Math.round(me.x), y: Math.round(me.y)};
    if (forest.sceneCache) delete forest.sceneCache;
    forest.rain = (Math.random() < 0.25) ? Math.random() * 10 + 10 : 0;//RA
    forest.lockedUI = false;
    toScene();
} }