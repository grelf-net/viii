// Part of The Forest
// Copyright (c) Graham Relf, UK, 2014-24
// www.grelf.net
'use strict';
function Map(screen, observer, scale, stepSize)
{ this.kind = "combined";
  this.centre = {x:Math.round(observer.x), y:Math.round(observer.y)};
  this.scale = scale;
  this.step = stepSize;
  this.wd = screen.wd;
  this.wd2 = this.wd / 2;
  this.ht = screen.ht;
  this.ht2 = this.ht / 2;
this.WHITE = [255, 255, 255, 255]; // R, G, B, alpha
this.cssRED = "#f00";
this.BROWN = [184, 78, 27, 255];//PMS471 = #b84e1b
this.cssBROWN = "#b84e1b";
this.BLACK = [0, 0, 0, 255];
this.cssBLACK = "#000";
this.BLUE = [0, 170, 231, 255];//PMS299 = #00aae7
this.cssBLUE = "#00aae7";
this.YELLOW = [253, 183, 59, 255];//PMS136 = #fdb73b
this.cssYELLOW = "#fdb73b";
this.OCHRE = [192, 192, 127, 255];
this.cssOCHRE = "#cc7";
this.GREEN = [0, 128, 0, 255];//[11, 177, 77, 255];//PMS361 = #0bb14d
this.cssGREEN = "#080";//"#0bb14d";
this.GREY = [153, 153, 153, 255];
this.cssGREY = "#999";
this.colours = new Array(50);
this.colours[TERRAINS.LAKE] = this.BLUE;
this.colours[TERRAINS.TOWN] = this.GREY;
this.colours[TERRAINS.MUD] = [92, 39, 14, 255];//RA: dark brown (was this.GREY)
this.colours[TERRAINS.GRASS] = this.YELLOW;
this.colours[TERRAINS.MOOR] = this.OCHRE;
this.colours[TERRAINS.WOOD] = this.WHITE;
this.colours[TERRAINS.THICKET] = this.GREEN;
this.colours[TERRAINS.Z] = this.WHITE;
this.colours[TERRAINS.MINE] = this.BLACK;
this.colours[TERRAINS.BOULDER] = this.BLACK;
this.colours[TERRAINS.ROOT] = this.GREEN;
this.colours[TERRAINS.KNOLL] = this.BROWN;
this.colours[TERRAINS.WATERHOLE] = this.BLUE;
this.colours[TERRAINS.ROAD] = [200, 200, 200, 255];
this.colours[TERRAINS.PATH] = this.GREY;
this.colours[TERRAINS.STREAM] = this.BLUE;
this.colours[TERRAINS.SNOW] = [230, 240, 255, 255]; // pale blue
this.CI = 40; // Contour Interval
this.CI2 = this.CI / 2;
this.CI5 = this.CI * 2.5;
this.STZ = 8;
this.STZ2 = 2 * this.STZ;
this.SQS3 = this.STZ * Math.sqrt(3);
  this.drawLegend();//Must do first
  this.canvas = document.createElement('canvas');
  this.canvas.width = this.wd;
  this.canvas.height = this.ht;
  this.g2 = this.canvas.getContext('2d');
  this.b = 0;// degrees
  this.orienting = false;
  document.getElementById("orient").checked = false;
  this.mines = null; this.nMines = 0;
  this.boulders = null; this.nBoulders = 0;
  this.roots = null; this.nRoots = 0;
  this.waterholes = null; this.nWaterholes = 0;
  this.knolls = null; this.nKnolls = 0;
  this.Xs = null; this.nXs = 0;
  this.Ts = null; this.nTs = 0;
  this.buildings = null; this.nBuildings = 0;
  this.showHelis = false;
  this.helis = null; this.nHelis = 0;
  this.BHWD = Building.prototype.HALFWIDTH;
  this.BWD = Building.prototype.WIDTH;
  this.ground = new Array(this.wd);
  for (var x = 0; x < this.wd; x++) { this.ground[x] = new Array(this.ht); }
}

Map.prototype.changeOrient = function() 
{ this.orienting = document.getElementById("orient").checked;
  if (this.orienting) this.b = 0;
  if (forest.showing === "map") this.draw(); 
};
          
Map.prototype.turn = function(degs) { this.b = (this.b - degs) % 360; this.draw(); };

Map.prototype.jumpTo = function(position)
{ this.centre = {x:Math.round(position.x), y: Math.round(position.y)}; };

Map.prototype.jumpToCentre = function()
{ var c = this.centre;
  if (forest.terrain.terra(c.x, c.y).terrain === TERRAINS.TOWN) message('Sorry', 'No jumping into towns');
  else if (forest.observer.inside) message('Sorry', 'No jumping when', 'you are inside', 'a building');
  else forest.observer.jumpTo(c); 
};

Map.prototype.mapPt = function(pt) { return { x: pt.x - this.x0, y: this.y0 - pt.y }; };

Map.prototype.drawLegend = function()
{ var cnv = document.getElementById("legend");
  this.g2 = cnv.getContext('2d');
  var wd = cnv.width, ht = cnv.height;
  this.g2.fillStyle = '#fff';
  this.g2.fillRect(0, 0, wd, ht);
  this.g2.font = "12px sans-serif";
  var ptTL = new Point(8, 8), boxWd = 64, boxHt = 20;
  var grassStyle = this.cssYELLOW;
  var moorStyle = this.cssOCHRE;
  var thickStyle = this.cssGREEN;
  var lakeStyle = this.cssBLUE;
  var pavedStyle = this.cssGREY;
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, "grass", grassStyle, grassStyle, '#000');
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, "moor", moorStyle, moorStyle, '#000');
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, "wood", '#fff', pavedStyle, '#000');
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, "thicket", thickStyle, thickStyle, '#fff');
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, "water", lakeStyle, lakeStyle, '#fff');
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, "paved", pavedStyle, pavedStyle, '#fff');
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, "snow", '#e6f0ff', pavedStyle, '#000');
  this.drawSwatchAndIncPt(ptTL, boxWd, boxHt, " mud", '#5c270e', '#5c270e', '#fff');
  var xSym = 90, ySym = 12;
  var ptSym = new Point(xSym, ySym);
  this.plotDot(ptSym, '#000');
  this.g2.fillText("boulder", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 16;
  this.plotV(ptSym, '#000');
  this.g2.fillText("mineshaft or cave", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 16;
  this.plotX(ptSym, '#000');
  this.g2.fillText("man-made object", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 16;
  this.g2.fillRect(ptSym.x - 4, ptSym.y - 4, 8, 8);
  this.g2.fillText("building", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 16;
  this.plotDot(ptSym, this.cssBROWN);
  this.g2.fillStyle = '#000';
  this.g2.fillText("knoll", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 16;
  this.plotX(ptSym, this.cssGREEN);
  this.g2.fillStyle = '#000';
  this.g2.fillText("rootstock", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 16;
  this.plotV(ptSym, this.cssBLUE);
  this.g2.fillStyle = '#000';
  this.g2.fillText("water hole", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 16;
  this.plotMarsh(ptSym.x, ptSym.y);
  this.g2.fillStyle = '#000';
  this.g2.fillText("marsh", ptSym.x + 12, ptSym.y + 4);
  ptSym.y += 16;
  this.g2.strokeStyle = lakeStyle;
  this.g2.lineWidth = 2;
  this.g2.beginPath();
  this.g2.moveTo(ptSym.x - 4, ptSym.y);
  this.g2.lineTo(ptSym.x + 12, ptSym.y);
  this.g2.stroke(); 
  this.g2.fillStyle = '#000';
  this.g2.fillText("stream", ptSym.x + 20, ptSym.y + 4);
  ptSym.y += 16;
  this.g2.setLineDash([12, 4]);
  this.g2.strokeStyle = '#000';
  this.g2.beginPath();
  this.g2.moveTo(ptSym.x - 12, ptSym.y);
  this.g2.lineTo(ptSym.x + 16, ptSym.y);
  this.g2.stroke(); 
  this.g2.fillText("road", ptSym.x + 20, ptSym.y + 4);
  this.g2.lineWidth = 1;
  this.g2.setLineDash([]);
  ptSym.y += 16;
  this.plotT({x:ptSym.x, y:ptSym.y}, '#f00');
  this.g2.fillText("phone box", ptSym.x + 20, ptSym.y + 4);
  ptSym.y += 16;
  this.g2.fillStyle = '#fa0';
  this.g2.fillRect(ptSym.x - 5, ptSym.y - 5, 10, 10);
  this.g2.fillStyle = '#000';
  this.g2.fillText("ladder", ptSym.x + 8, ptSym.y + 4);
  ptSym.y += 24;
  ptSym.x = 24;
  this.plotObserverSymbol(ptSym, 270, '#f00');
  this.g2.fillStyle = '#000';
  this.g2.fillText("observer (facing west)", ptSym.x + 20, ptSym.y + 4);
};

Map.prototype.drawSwatchAndIncPt = function(ptTL, wd, ht, name, fill, stroke, text)
{ this.g2.fillStyle = fill;
  this.g2.strokeStyle = stroke;
  this.g2.fillRect(ptTL.x, ptTL.y, wd, ht);
  this.g2.strokeRect(ptTL.x, ptTL.y, wd, ht);
  this.g2.fillStyle = text;
  this.g2.fillText(name, ptTL.x + 8, ptTL.y + 14);
  ptTL.y += 24;
};

function handleMapClick(e)
{ var pt = getMousePoint(e), ft = forest.terrain;
  var gndPt = forest.map.getGroundXY(pt.x, pt.y);
  var tr = ft.terra(gndPt.x, gndPt.y);
  var hd;
  if (tr.height > ft.LAKE_HT0) hd = "Height " + (tr.height - ft.LAKE_HT0).toFixed(0);
  else hd = "Depth " + tr.depth.toFixed(0);
  forest.mapui = new MapUI(
'<div id="divtitle">MAP INFO <span id="draggable">[draggable]</span></div>' +
'<div id="divbody">' +
'<p>' + hd + 'm ' + TERRAINS.getName(tr.terrain) + '</p>' +
'<p> at x = ' + gndPt.x.toFixed(0) + ', y = ' + gndPt.y.toFixed(0) + '</p>' +
'<p><input type="button" value="Close" onclick="uiClose()"></p></div>');
}

Map.prototype.draw = function()
{ var t0 = new Date().getTime(); // ms
  var i, me = forest.observer;
  if (me.heliMeter) this.showHelis = true;
  forest.terrain.mapMode = true;
  this.x0 = this.centre.x - this.wd2;
  this.y0 = this.centre.y + this.ht2;
  if (this.kind === "contour") this.theMap(false, true, true);
  else if (this.kind === "terrain") this.theMap(true, false, true);
  else this.theMap(true, true, true);
  if (this.kind !== "contour" && !forest.terrain.bleak) drawRoads(this.g2);
  this.plotRange(me, "#f00");
  this.plotObserver(me, "#f00");
  if (this.kind !== "contour")
  { for (i = 0; i < this.nMines; i++) this.plotMine(i); 
    for (i = 0; i < this.nRoots; i++) this.plotRoot(i);
    for (i = 0; i < this.nBoulders; i++) this.plotBoulder(i);
    for (i = 0; i < this.nKnolls; i++) this.plotKnoll(i);
    for (i = 0; i < this.nWaterholes; i++) this.plotPond(i);
    for (i = 0; i < this.nXs; i++) this.plotManMade(i);
    for (i = 0; i < this.nTs; i++) this.plotTele(i);//ZY
    for (i = 0; i < this.nBuildings; i++) this.plotBuilding(i);
    if (this.showHelis) 
    { for (i = 0; i < this.nHelis; i++) this.plotX(this.helis[i], "#f00");//RA
  } }
  this.plotNorthLines();
  forest.terrain.mapMode = false;
  if (this.orienting) this.orient((me.b + this.b) % 360);
  else if (0 !== this.b) this.orient(this.b);
  else this.display();
  var dt = new Date().getTime() - t0; // ms
  forest.infoDiv.innerHTML = "Map centre: x = " + Math.round(this.centre.x) + 
    ", y = " + Math.round(this.centre.y) + " Drawn in " + dt + "ms";
};

Map.prototype.display = function()
{ let g2 = forest.screen.g2, im = new Image();
  im.onload = function() 
  { g2.drawImage(im, 0, 0);
    if (forest.observer.heliMeter) forest.observer.heliMeter.draw(forest.map.nHelis);
  };
  im.src = this.canvas.toDataURL('image/png');
};

Map.prototype.orient = function(b)
{ var g2 = forest.screen.g2;
  g2.fillStyle = '#fff';
  g2.fillRect(0, 0, this.wd, this.ht);
  g2.save();
  g2.translate(this.wd2, this.ht2);
  g2.rotate(-b * DEG2RAD);
  g2.translate(-this.wd2, -this.ht2);
  var im = new Image();
  im.onload = function() 
  { g2.drawImage(im, 0, 0);
    g2.restore();
  };
  im.src = this.canvas.toDataURL('image/png');
};

Map.prototype.plotMine = function(i) { this.plotV(this.mines[i], "#000"); };
Map.prototype.plotRoot = function(i) { this.plotX(this.roots[i], this.cssGREEN); };
Map.prototype.plotBoulder = function(i) { this.plotDot(this.boulders[i], "#000"); };
Map.prototype.plotKnoll = function(i) { this.plotDot(this.knolls[i], this.cssBROWN); };
Map.prototype.plotManMade = function(i){ this.plotX(this.Xs[i], this.cssBLACK); };
Map.prototype.plotTele = function(i) { this.plotT(this.Ts[i], this.cssRED); };

Map.prototype.plotBuilding = function(i)
{ var pt = this.buildings[i];
  this.g2.fillStyle = this.cssBLACK;
  this.g2.fillRect (pt.x - this.BHWD, pt.y - this.BHWD, this.BWD, this.BWD);
};

Map.prototype.plotPond = function(i)
{ var p = this.waterholes[i];
  new Stream(p.x + this.x0, this.y0 - p.y).draw(this.g2);
  this.plotV(p, this.cssBLUE);
};

Map.prototype.changeScroll = function()
{ var el = document.getElementById("mapscroll");
  this.step = parseInt(el.options[el.selectedIndex].value);
  refocus();
};

Map.prototype.moveDown = function() { this.centre.y -= this.step; this.draw(); };
Map.prototype.moveLeft = function() { this.centre.x -= this.step; this.draw(); };
Map.prototype.moveRight = function() { this.centre.x += this.step; this.draw(); };
Map.prototype.moveUp = function() { this.centre.y += this.step; this.draw(); };

Map.prototype.getScreenXY = function(x, y)
{ // Given ground coordinates
  return {x:x - this.x0, y:this.y0 - y};
};

Map.prototype.getGroundXY = function(sx, sy)
{ // Given screen coordinates
  return new Point(sx + this.x0, this.y0 - sy);
};

Map.prototype.plotObserver = function(observer, cssColour)
{ var sxy = this.getScreenXY(observer.x, observer.y);
  this.plotObserverSymbol(sxy, observer.b, cssColour);
};

Map.prototype.plotObserverSymbol = function(sxy, b, cssColour)
{ this.g2.strokeStyle = cssColour;
  this.g2.fillStyle = cssColour;
  this.g2.beginPath();
  this.g2.arc(sxy.x, sxy.y, 10, 0, TWO_PI, true);
  this.g2.closePath();
  this.g2.stroke();
  var b0 = ((b - 90) % 360), b0rad = b0 * DEG2RAD;
  var cosb0 = Math.cos(b0rad), sinb0 = Math.sin(b0rad);
  var bp45 = ((b0 + 45) % 360) * DEG2RAD;
  var bm45 = ((b0 - 45) % 360) * DEG2RAD;
  this.g2.beginPath();
  this.g2.moveTo(sxy.x + 15 * cosb0, sxy.y + 15 * sinb0);
  this.g2.lineTo(sxy.x + 10 * Math.cos(bp45), sxy.y + 10 * Math.sin(bp45));
  this.g2.lineTo(sxy.x + 10 * Math.cos(bm45), sxy.y + 10 * Math.sin(bm45));
  this.g2.lineTo(sxy.x + 15 * cosb0, sxy.y + 15 * sinb0);
  this.g2.closePath();
  this.g2.fill();
};

Map.prototype.plotRange = function(observer, cssColour)
{ var sxy = this.getScreenXY(observer.x, observer.y);
  this.g2.strokeStyle = cssColour;
  this.g2.fillStyle = cssColour;
  this.g2.setLineDash([16, 16]);
  this.g2.lineWidth = 1;
  this.g2.beginPath();
  this.g2.arc(sxy.x, sxy.y, forest.scene.range_m, 0, TWO_PI);
  this.g2.stroke();
  this.g2.setLineDash([]);
};

Map.prototype.plotNorthLines = function()
{ this.g2.fillStyle = this.cssBLACK;
  this.g2.strokeStyle = this.cssBLACK;
  this.g2.lineWidth = 1;
  var ht1 = this.ht - 1;
  for (var x = 100; x < this.wd; x += 300)
  { this.g2.beginPath();
    this.g2.moveTo(x, 0);
    this.g2.lineTo(x - 10, 25);
    this.g2.lineTo(x + 10, 25);
    this.g2.closePath();
    this.g2.fill();
    this.g2.beginPath();
    this.g2.moveTo(x, ht1);
    this.g2.lineTo(x, 0);
    this.g2.lineTo(x - 10, 25);
    this.g2.lineTo(x + 10, 25);
    this.g2.lineTo(x, 0);
    this.g2.stroke();
  }
};

Map.prototype.plotDot = function(pt, cssColour)
{ this.g2.fillStyle = "#fff"; // White around
  this.g2.beginPath();
  this.g2.arc(pt.x, pt.y, 3, 0, TWO_PI, true);
  this.g2.closePath();
  this.g2.fill();
  this.g2.fillStyle = cssColour;
  this.g2.beginPath();
  this.g2.arc(pt.x, pt.y, 2, 0, TWO_PI, true);
  this.g2.closePath();
  this.g2.fill();
};

Map.prototype.plotT = function(pt, cssColour)
{ var xTL, yTL, xTR, yTR, xB, yB;
  xTL = pt.x - 4; yTL = pt.y - 4;
  xB = pt.x; yB = pt.y + 4;
  xTR = pt.x + 4; yTR = pt.y - 4;
  this.g2.strokeStyle = "#fff";
  this.g2.lineWidth = 3;
  this.g2.beginPath();
  this.g2.moveTo(xTL, yTL);
  this.g2.lineTo(xTR, yTR);
  this.g2.lineTo(xB, yTR);
  this.g2.lineTo(xB, yB);
  this.g2.stroke();
  this.g2.strokeStyle = cssColour;
  this.g2.lineWidth = 1;
  this.g2.stroke();
};

Map.prototype.plotV = function(pt, cssColour)
{ var xTL, yTL, xTR, yTR, xB, yB;
  xTL = pt.x - 3; yTL = pt.y - 3;
  xB = pt.x; yB = pt.y + 3;
  xTR = pt.x + 3; yTR = pt.y - 3;
  this.g2.strokeStyle = "#fff";
  this.g2.lineWidth = 3;
  this.g2.beginPath();
  this.g2.moveTo(xTL, yTL);
  this.g2.lineTo(xB, yB);
  this.g2.lineTo(xTR, yTR);
  this.g2.stroke();
  this.g2.strokeStyle = cssColour;
  this.g2.lineWidth = 1;
  this.g2.stroke();
};

Map.prototype.plotX = function(pt, cssColour)
{ this.g2.strokeStyle = "#fff";
  this.g2.lineWidth = 3;
  this.g2.beginPath();
  this.g2.moveTo(pt.x - 3, pt.y - 3);
  this.g2.lineTo(pt.x + 3, pt.y + 3);
  this.g2.moveTo(pt.x - 3, pt.y + 3);
  this.g2.lineTo(pt.x + 3, pt.y - 3);
  this.g2.stroke();
  this.g2.strokeStyle = cssColour;
  this.g2.lineWidth = 1;
  this.g2.stroke();
};

Map.prototype.plotMarsh = function(x, y)
{ this.g2.strokeStyle = this.cssBLUE;
  strokeLine(this.g2, x - 2, y - 6, x + 2, y - 6);
  strokeLine(this.g2, x - 4, y - 3, x + 4, y - 3);
  strokeLine(this.g2, x - 6, y, x + 6, y);
  strokeLine(this.g2, x - 4, y + 3, x + 4, y + 3);
  strokeLine(this.g2, x - 2, y + 6, x + 2, y + 6);
};

Map.prototype.recentre = function(observer)
{ this.centre = {x: Math.round(observer.x), y: Math.round(observer.y)};
  this.draw();
};

Map.prototype.setButtons = function()
{ showButtons(mapButtons);
  var el = document.getElementById("mapSettings");
  el.innerHTML =
'<div>Map scroll step size: ' +
'<select id="mapscroll" onchange="changeScroll()" tabindex="-1">' +
'<option value="25">25m</option>' +
'<option value="50">50m</option>' +
'<option value="100">100m</option>' +
'<option value="200">200m</option>' +
'<option value="400">400m</option>' +
'<option value="800">800m</option></select><br/><br/>Map kind: ' +
'<select id="mapkind" onchange="switchMapKind()">' +
'<option value="0">Normal</option>' +
'<option value="1">Contours only</option>' +
'<option value="2">Terrain types</option></select></div>';
    el = document.getElementById("mapkind");
    switch (this.kind)
    {
case "combined": el.selectedIndex = 0; break;
case "contour": el.selectedIndex = 1; break;
case "terrain": el.selectedIndex = 2; break;
  }
  el = document.getElementById("mapscroll");
  switch (this.step)
  {
case 25: el.selectedIndex = 0; break;
case 50: el.selectedIndex = 1; break;
case 100: el.selectedIndex = 2; break;
case 200: el.selectedIndex = 3; break;
case 400: el.selectedIndex = 4; break;
case 800: el.selectedIndex = 5; break;
  }
};

Map.prototype.switchKind = function()
{ var el = document.getElementById("mapkind");
  switch (el.selectedIndex)
  {
case 0: this.kind = "combined"; break;
case 1: this.kind = "contour"; break;
case 2: this.kind = "terrain"; break;
  }
  if (forest.showing === "map") this.draw();
  refocus();
};

Map.prototype.clearFeatures = function()
{ this.mines = new Array(200); this.nMines = 0;
  this.boulders = new Array(200); this.nBoulders = 0;
  this.roots = new Array(200); this.nRoots = 0;
  this.waterholes = new Array(200); this.nWaterholes = 0;
  this.knolls = new Array(200); this.nKnolls = 0;
  this.Xs = new Array(200); this.nXs = 0;
  this.Ts = new Array(10); this.nTs = 0;//ZY
  this.buildings = new Array(200); this.nBuildings = 0;
  if (this.showHelis) { this.helis = new Point(200); this.nHelis = 0; }
};

Map.prototype.noteAnyFeature = function(feature, plotX, plotY)
{ switch (feature)
  {
case FEATURES.MINE: 
    this.mines[this.nMines] = new Point(plotX, plotY); this.nMines++; break;
case FEATURES.BOULDER:
    this.boulders[this.nBoulders] = new Point(plotX, plotY); this.nBoulders++; break;
case FEATURES.ROOT:
    this.roots[this.nRoots] = new Point(plotX, plotY); this.nRoots++; break;
case FEATURES.WATERHOLE:
    this.waterholes[this.nWaterholes] = new Point(plotX, plotY); this.nWaterholes++; break;
case FEATURES.KNOLL:
    this.knolls[this.nKnolls] = new Point(plotX, plotY); this.nKnolls++; break;
case FEATURES.X:
    this.Xs[this.nXs] = new Point(plotX, plotY); this.nXs++; break;
case FEATURES.T:
    this.Ts[this.nTs] = new Point(plotX, plotY); this.nTs++; break;
case FEATURES.CONE:
    if (coneIsHeli(this.ground[plotX][plotY].terrain))
    { if (this.showHelis) 
      { this.helis[this.nHelis] = new Point(plotX, plotY); this.nHelis++; 
    } } 
    break;
  }
};

Map.prototype.aboveOrBelow = function(ht) 
{ // returns -1 (below), 0 (on), +1 (above) contour
  var htci = ht % this.CI;
  if (htci > this.CI2) return -1;
  if (htci > 0) return 1;
  return 0; // Unlikely
};

Map.prototype.line = function(x1, y1, x2, y2)
{ this.g2.beginPath();
  this.g2.moveTo(x1, y1);
  this.g2.lineTo(x2, y2);
  this.g2.stroke();
};
    
Map.prototype.theMap = function(showVeg, showCont, showFeat)
{ this.clearFeatures();
  var ft = forest.terrain;
  var im = this.g2.createImageData(this.wd, this.ht);
  var data = im.data;
  var px, gnd, i = 0;
  for (var y = this.y0, plotY = 0; y > this.y0 - this.ht; y--, plotY++)
  { for (var x = this.x0, plotX = 0; x < this.x0 + this.wd; x++, plotX++)
    { gnd = ft.terra(x, y);
      this.ground[plotX][plotY] = gnd;
      if (showVeg)
      { px = this.colours[gnd.terrain];
        for (var b = 0; b < 4; b++, i++) { data[i] = px[b]; }
      }
      else
      { if (gnd.terrain === TERRAINS.LAKE) px = this.BLUE;
        else px = this.WHITE;
        for (var b = 0; b < 4; b++, i++) { data[i] = px[b]; }
      }
      if (showFeat) this.noteAnyFeature(gnd.feature, plotX, plotY);
      if (gnd.terrain === TERRAINS.TOWN && Building.prototype.atCentre(x, y))
      { this.buildings[this.nBuildings] = new Point(plotX, plotY);
        this.nBuildings++;
  } } }
  this.g2.putImageData(im, 0, 0);
  if (showCont)
  { // Contours:
  this.g2.strokeStyle = this.cssBROWN;
  this.g2.lineWidth = 1;
  var SZ = 1; // Size of mesh
  var SZ1 = SZ / 4;
  var SZ2 = SZ / 2;
  var SZ3 = SZ1 + SZ2;
  var gTL, hTL, gTR, hTR, gBL, hBL, gBR, hBR, gM, hM, gM5;
  // T = Top, B = Bottom, L = left, R = right, M = Middle
  var ix1, ix2, ix3, ix4, iy1, iy2, iy3, iy4; // Quarters
  for (var iy = 0; iy < this.ht - SZ; iy += SZ)
  { iy1 = iy + SZ1; iy2 = iy + SZ2; iy3 = iy + SZ3; iy4 = iy + SZ;
    for (var ix = 0; ix < this.wd - SZ; ix += SZ)
    { ix1 = ix + SZ1; ix2 = ix + SZ2; ix3 = ix + SZ3; ix4 = ix + SZ;
      gTL = this.ground[ix][iy].height;
      hTL = this.aboveOrBelow(gTL);
      gTR = this.ground[ix4][iy].height;
      hTR = this.aboveOrBelow(gTR);
      gBR = this.ground[ix4][iy4].height;
      hBR = this.aboveOrBelow(gBR);
      gBL = this.ground[ix][iy4].height;
      hBL = this.aboveOrBelow(gBL);
      gM = (gTL + gTR + gBR + gBL) / 4;
      hM = this.aboveOrBelow(gM) ;
      gM5 = gM % this.CI5;
      if (gM5 < 10 || gM5 > this.CI5 - 10) { this.g2.lineWidth = 2; }
      else { this.g2.lineWidth = 1; }
      // Top triangle:
      if (!(hTL === hTR && hTR === hM)) // Not all the same
      { if (hTL > 0)
        { if (hTR > 0 && hM < 0) this.line (ix1, iy1, ix3, iy1);
          else if (hTR < 0)
          { if (hM > 0) this.line (ix2, iy, ix3, iy1);
            else if (hM < 0) this.line (ix2, iy, ix1, iy1);
            else this.line (ix2, iy, ix2, iy2); // hM == 0
          }
          else // hTR == 0
          { if (hM < 0) this.line (ix1, iy1, ix4, iy);
            else if (hM === 0) this.line (ix4, iy, ix2, iy2);
        } }
        else if (hTL < 0)
        { if (hTR > 0)
          { if (hM > 0) this.line (ix2, iy, ix1, iy1);
            else if (hM < 0) this.line (ix2, iy, ix3, iy1);
            else this.line (ix2, iy, ix2, iy2); // hM == 0
          }
          else if (hTR < 0 && hM > 0) this.line (ix1, iy1, ix3, iy1);
          else // hTR == 0
          { if (hM > 0) this.line (ix1, iy1, ix4, iy);
            else if (hM === 0) this.line (ix4, iy, ix2, iy2);
        } }
        else // hTL == 0
        { if (hTR > 0)
          { if (hM < 0) this.line (ix, iy, ix3, iy1);
            else if (hM === 0) this.line (ix, iy, ix2, iy2);
          }
          else if (hTR < 0)
          { if (hM > 0) this.line (ix, iy, ix3, iy1);
            else if (hM === 0) this.line (ix, iy, ix2, iy2);
          }
          else this.line (ix, iy, ix4, iy); // hTR == 0
      } }
      // Left triangle:
      if (!(hTL === hBL && hTL === hM))
      { if (hTL < 0)
        { if (hBL < 0 && hM > 0) this.line (ix1, iy1, ix1, iy3);
          else if (hBL > 0)
          { if (hM < 0) this.line (ix, iy2, ix1, iy3);
            else if (hM > 0) this.line (ix, iy2, ix1, iy1);
            else this.line (ix, iy2, ix2, iy2); // hM == 0
          }
          else // hBL == 0
          { if (hM > 0) this.line (ix, iy4, ix1, iy1);
            else if (hM === 0) this.line (ix, iy4, ix2, iy2);
        } }
        else if (hTL > 0)
        { if (hBL > 0 && hM < 0) this.line (ix1, iy1, ix1, iy3);
          else if (hBL < 0)
          { if (hM > 0) this.line (ix, iy2, ix1, iy3);
            else if (hM < 0) this.line (ix, iy2, ix1, iy1);
            else this.line (ix, iy2, ix2, iy2); // hM == 0
          }
          else // hBL == 0
          { if (hM < 0) this.line (ix, iy4, ix1, iy1);
            else if (hM === 0) this.line (ix, iy4, ix2, iy2);
        } }
        else // hTL == 0
        { if (hBL > 0)
          { if (hM < 0) this.line (ix, iy, ix1, iy3);
            else if (hM === 0) this.line (ix, iy, ix2, iy2);
          }
          else if (hBL < 0)
          { if (hM > 0) this.line (ix, iy, ix1, iy3);
            else if (hM === 0) this.line (ix, iy, ix2, iy2);
          }
          else this.line (ix, iy, ix, iy4); // hBL == 0
      } }
      // Bottom triangle:
      if (!(hBL === hBR && hBL === hM))
      { if (hBL > 0)
        { if (hBR > 0 && hM < 0) this.line (ix1, iy3, ix3, iy3);
          else if (hBR < 0)
          { if (hM > 0) this.line (ix2, iy4, ix3, iy3);
            else if (hM < 0) this.line (ix1, iy3, ix2, iy4);
            else this.line (ix2, iy2, ix2, iy4); // hM == 0
          }
          else // hBR == 0
          { if (hM < 0) this.line (ix1, iy3, ix4, iy4);
            else if (hM === 0) this.line (ix2, iy2, ix4, iy4);
        } }
        else if (hBL < 0)
        { if (hBR > 0)
          { if (hM > 0) this.line (ix1, iy3, ix2, iy4);
            else if (hM < 0) this.line (ix2, iy4, ix3, iy3);
            else this.line (ix2, iy2, ix2, iy4); // hM == 0
          }
          else if (hBR < 0 && hM > 0) this.line (ix1, iy3, ix3, iy3);
          else // hBR == 0
          { if (hM > 0) this.line (ix1, iy3, ix4, iy4);
            else if (hM === 0) this.line (ix2, iy2, ix4, iy4);
        } }
        else // hBL == 0
        { if (hBR > 0)
          { if (hM < 0) this.line (ix, iy4, ix3, iy3);
            else if (hM === 0) this.line (ix, iy4, ix2, iy2);
          }
          else if (hBR < 0)
          { if (hM > 0) this.line (ix, iy4, ix3, iy3);
            else if (hM === 0) this.line (ix, iy4, ix2, iy2);
          }
          else this.line (ix, iy4, ix4, iy4); // hBR == 0
      } }
      // Right triangle:
      if (!(hTR === hBR && hTR === hM))
      { if (hTR > 0)
        { if (hBR > 0 && hM < 0) this.line (ix3, iy1, ix3, iy3);
          else if (hBR < 0)
          { if (hM > 0) this.line (ix4, iy2, ix3, iy3);
            else if (hM < 0) this.line (ix3, iy1, ix4, iy2);
            else this.line (ix2, iy2, ix4, iy2); // hM == 0
          }
          else // hBR == 0
          { if (hM < 0) this.line (ix3, iy1, ix4, iy4);
            else if (hM === 0) this.line (ix2, iy2, ix4, iy4);
        } }
        else if (hTR < 0)
        { if (hBR > 0)
          { if (hM > 0) this.line (ix3, iy1, ix4, iy2);
            else if (hM < 0) this.line (ix3, iy3, ix4, iy2);
            else this.line (ix2, iy2, ix4, iy2); // hM == 0
          }
          else if (hBR < 0 && hM > 0) this.line (ix3, iy1, ix3, iy3);
          else // hBR == 0
          { if (hM > 0) this.line (ix3, iy1, ix4, iy4);
            else if (hM === 0) this.line (ix2, iy2, ix4, iy4);
        } }
        else //hTR == 0
        { if (hBR > 0)
          { if (hM < 0) this.line (ix4, iy, ix3, iy3);
            else if (hM === 0) this.line (ix2, iy2, ix4, iy);
          }
          else if (hBR < 0)
          { if (hM > 0) this.line (ix4, iy, ix3, iy3);
            else if (hM === 0) this.line (ix2, iy2, ix4, iy);
          }
          else this.line (ix4, iy, ix4, iy4);// hBR == 0
  } } } } }
};