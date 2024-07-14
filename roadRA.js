// Part of The Forest
// Copyright (c) Graham Relf, UK, 2019-24
// www.grelf.net
'use strict';

function drawRoads(g2)
{ var ft = forest.terrain;
  for (var i = 0; i < ft.roads.length; i++) { ft.roads [i].draw(g2); }
}

function Road () { this.path = []; }

Road.prototype.addPoint = function(x, y) { this.path.push(new Point(x, y)); };

Road.prototype.draw = function(g2)
{ if (this.path.length < 2) return;
  var fm = forest.map, pt = fm.mapPt(this.path [0]);
  var onMap = pt.x >= 0 && pt.x <= fm.wd && pt.y >= 0 && pt.y <= fm.ht;//EM
  g2.beginPath();
  g2.moveTo(pt.x, pt.y);
  for (var i = 1; i < this.path.length; i++)
  { pt = fm.mapPt(this.path[i]);
    onMap = onMap || (pt.x >= 0 && pt.x <= fm.wd && pt.y >= 0 && pt.y <= fm.ht);//EM
    g2.lineTo(pt.x, pt.y);
  }
  if (!onMap) return;//EM
  g2.lineWidth = 2;
  g2.strokeStyle = '#000';
  g2.setLineDash([12, 4]);
  g2.stroke();
};

function buildRoad(xy)// array of alternate x,y integers
{ if (0 !== xy.length % 2) { message("Road xy not in pairs"); return null; }
  var rd = new Road();
  var x = xy[0], y = xy[1], prevX, prevY;
  rd.addPoint (x, y);
  for (var i = 2; i < xy.length - 1; i += 2)
  { prevX = x; prevY = y;
    x = xy[i]; y = xy[i + 1];
    rd.addPoint (x, y);
    paveLine(prevX, prevY, x, y);
  }
  return rd;
}

function paveLine(x0, y0, x1, y1)
{ var dx = x1 - x0, dy = y1 - y0;
  var d = Math.sqrt(dx * dx + dy * dy);
  dx = dx / d; dy = dy / d;
  var x = x0, y = y0;
  for (var i = 0; i <= d; i++)
  { pave (Math.round(x), Math.round(y), 2);//EK: was 1
    x += dx; y += dy;
} }

function pave(x, y, halfWd)
{ var ft = forest.terrain;
  for (var iy = y - halfWd; iy <= y + halfWd; iy++)
  { for (var ix = x - halfWd; ix <= x + halfWd; ix++)
    { ft.place(ix, iy, TERRAINS.ROAD); }
} }

// Engineering:
function handleEngClick(e)
{ var pt = getMousePoint(e);
  forest.roadPt = forest.map.getGroundXY(pt.x, pt.y);
  forest.mapui = new MapUI(
'<div id="divtitle">ENGINEERING <span id="draggable">[draggable]</span></div>' +
'<div id="divbody">' +
'<p><input type="button" value="Start road here" onclick="roadStart()"></p>' +
'<p><input type="button" value="Extend road to here" onclick="roadAdd()"></p>' +
'<p><input type="button" value="Delete previous" onclick="roadSub()"></p>' +
'<p><input type="button" value="End road here" onclick="roadEnd()"> - makes<br/>' +
'road visible in scenes</p>' +
//'<p><input type="button" value="Show road data as JSON" onclick="roadsToJSON()"></p>' +
'<p><input type="button" value="Close this menu" onclick="uiClose()"></p></div>');
}

function roadStart()
{ forest.mapui.hide();
  forest.terrain.roads.push(buildRoad ([forest.roadPt.x, forest.roadPt.y]));
}

function roadAdd()
{ if (!forest.roadPt) return;
  var roads = forest.terrain.roads;
  var road = roads[roads.length - 1];
  var newPt = forest.roadPt;
  if (noLongBridge(road, newPt))
  { forest.mapui.hide();
    road.addPoint(newPt.x, newPt.y);
    centreMapOnRoadEnd();
} }

function roadSub()
{ forest.mapui.hide();
  var roads = forest.terrain.roads;
  var path = roads[roads.length - 1].path;
  path.splice(path.length - 1, 1);
  centreMapOnRoadEnd();
}

function roadEnd()
{ if (!forest.roadPt) return;
  var roads = forest.terrain.roads;
  var road = roads[roads.length - 1];
  var newPt = forest.roadPt;
  if (noLongBridge(road, newPt))
  { road.addPoint(newPt.x, newPt.y);
    paveRoad(road);
    centreMapOnRoadEnd();
} }

function paveRoad(road)
{ var path = road.path;
  var x = path[0].x, y = path[0].y;
  for (var i = 1; i < path.length; i++)
  { var prevX = x, prevY = y;
    x = path[i].x; y = path[i].y;
    paveLine(prevX, prevY, x, y);
} }

function noLongBridge(road, newPt)
{ var lastPt = road.path[road.path.length - 1];
  var d = lastPt.distance(newPt);
  var x = lastPt.x, y = lastPt.y;
  var dx = (newPt.x - x) / d;
  var dy = (newPt.y - y) / d;
  var bridgeLen = 0, ft = forest.terrain;
  for (var i = 0; i < d; i++)
  { x += dx; y += dy;
    if (ft.terra(x, y).height <= ft.LAKE_HT0) bridgeLen++;
  }
  if (bridgeLen > 60)
  { message(
"Planning permission refused", "",
"Bridging " + bridgeLen + "m of water",
"is too ambitious. Road ended.", true);
    paveRoad(road);
    uiClose();
//no    centreMapOnRoadEnd();
    return false;
  }
  return true;
}

function centreMapOnRoadEnd()
{ var roads = forest.terrain.roads;
  var road = roads[roads.length - 1];
  var xy = road.path[road.path.length - 1];
  forest.map.centre = {x:xy.x, y:xy.y}; 
  setTimeout(toMap, 50);
}

function roadSave()
{ forest.mapui.hide();
  saveRoads();
}

function saveRoads()
{ if (!storageAvailable('localStorage')) message("Local storage is not available in this browser");
  else localStorage.setItem ("MyRoads", JSON.stringify(forest.terrain.roads));
}

function loadRoads()
{ if (storageAvailable("localStorage"))
  { var rdString = localStorage.getItem("MyRoads");
    if (null !== rdString && rdString.length > 0) roadsFromJSON(rdString);
} }

function roadsFromJSON(str)
{ roadsFromArray(JSON.parse(str));
}

function roadsFromArray(rdArray)
{ if (null !== rdArray) // Convert anonymous objects to roads:
  { for (var rdNo = 0; rdNo < rdArray.length; rdNo++)
    { var path = rdArray[rdNo].path, coords = [];
      for (var ptNo = 0; ptNo < path.length; ptNo++)
      { var pt = path[ptNo];
        coords.push(pt.x); coords.push(pt.y);
      }
      forest.terrain.roads.push(buildRoad(coords));
  } } 
}

function roadsToJSON()
{ document.getElementById("results").innerHTML = JSON.stringify(forest.terrain.roads);
  engCancel();
}