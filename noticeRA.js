// Part of My Terrain
// Copyright (c) Graham Relf, UK, 2022-24
// www.grelf.net
'use strict';

function createNotice(widthPx, heightPx, title, lines)
{ var cnv = document.createElement('canvas');
  cnv.width = widthPx;
  cnv.height = heightPx;
  var g2 = cnv.getContext('2d');
  g2.fillStyle = '#fff';
  g2.fillRect(0, 0, widthPx, heightPx);
  g2.strokeStyle = '#000';
  g2.lineWidth = 4;
  g2.strokeRect(4, 4, widthPx - 8, heightPx - 8);
  g2.lineWidth = 1;
  g2.fillStyle = '#000';
  g2.font = 'bold 30px sans-serif';
  g2.textAlign = 'center';
  var wd2 = widthPx / 2, lineHt = 40;;
  g2.fillText(title, wd2, lineHt);
  g2.font = 'normal 30px sans-serif';
  for (var i = 0, y = lineHt * 2; i < lines.length; i++, y += lineHt)
  { g2.fillText(lines[i], wd2, y); }
  var im = new Image();
  im.onload = function() { im.loaded = true; }
  im.src = cnv.toDataURL('image/png');
  return im;//Allow time to load
}

function makeNotices()//returns array of images
{ let me = forest.observer, t0 = forest.tele.sites[0];
  let toTele0 = new Point(me.x, me.y).distanceAndBearing(t0);
  return [
createNotice(600, 450, "Notice 1",
["The first phone box is",
 toTele0.d.toFixed(0) + "m away from your",
 "starting position on",
 "bearing" + (toTele0.b * RAD2DEG).toFixed(0) + "degrees"]),
createNotice(600, 450, "Notice 2",
["It is safe to fall down",
 "mine shafts, as long as",
 "you have not flooded",
 "them. There is always",
 "a ladder for getting",
 "back out again"]),
createNotice(600, 450, "Notice 3",
["Your goal is to collect",
 "objects that are very",
 "near all of the phone",
 "boxes"]),
createNotice(600, 450, "Notice 4", 
["There are several ways",
 "you may be able to cross",
 "between islands if you",
 "need to"]),
createNotice(600, 450, "Notice 5", 
["There are useful devices",
 "you can find and collect",
 "if you go underground"]),
createNotice(600, 450, "Notice 6", 
["Roles other than Explorer",
 "enable you to do things",
 "that explorers cannot"]),
createNotice(600, 450, "Notice 7",
["The symbols and colours",
 "on the main maps mainly",
 "comply with standards for",
 "the sport of orienteering"]),
createNotice(600, 450, "Notice 8",
["There is more than one",
 "kind of device to find",
 "underground"])];
}