// The Forest
// Copyright (c) Graham Relf, UK, 2014-24
// www.grelf.net
'use strict';
const forest = {}, DEG2RAD = Math.PI / 180, RAD2DEG = 180 / Math.PI, 
  PI1000 = Math.PI * 1000, PI10000 = PI1000 * 10;

function init()
{ try
  {
  forest.url = "grelf.itch.io/viii";
  forest.lockedUI = false;
  forest.buttonsDiv = document.getElementById("belowButtons");
  forest.infoDiv = document.getElementById("info");
  forest.screen = new Screen();
  var fs = forest.screen;
  forest.workarea = new WorkArea(fs.wd, fs.ht);
  forest.terrain = new Terrain();
  forest.observer = new Observer({x:17288, y:7274}, random(0, 360));
  var me = forest.observer;
  var xy = forest.terrain.findGoodSite(me.x, me.y);//RA
  me.x = xy.x; me.y = xy.y;//RA
  forest.around = new Around();
  forest.scene = new Scene(fs);
  var url = new URL(window.location.href);
  var x = url.searchParams.get('x'); if (null !== x) me.x = parseFloat(x);
  var y = url.searchParams.get('y'); if (null !== y) me.y = parseFloat(y);
  var b = url.searchParams.get('b'); if (null !== b) me.b = parseFloat(b);
  if ('y' === url.searchParams.get('h')) { me.inHeli = true; me.heliUp(); }
  document.getElementById('range').selectedIndex = 1;//RA
  var r = url.searchParams.get('r'); 
  if (null !== r) 
  { var r_m = parseFloat(r);
    forest.scene.range_m = r_m;
    forest.scene.rangeSq = r_m * r_m;
    forest.around.aheadChange(r_m);
    perhapsSet("range", r); 
  }
  var s = url.searchParams.get('s'); 
  if (null !== s) { me.stride = parseFloat(s); perhapsSet("stride", s); }
  forest.map = new Map(fs, me, 1, 200);
  forest.mine = new Mine();//ZZ
  forest.mineMap = new MineMap(fs, me, 1, 200);
  forest.tele = new Tele();//Must come after me
  forest.map.orienting = checkBox(url, 'orient', 'orient');
  forest.scene.doFog = true;
  forest.rain = 0;//RA
  initSaveLoad();//RA
  forest.targets = [];
  forest.showing = "map";
  forest.map.setButtons();
  forest.downDone = false;
  forest.fwdTimerId = null;
  loadInsidePics();//RA
  forest.coinR1 = loadImage("R1_180sq.png");
  forest.coinR8 = loadImage("OchoReales1759_350sq.png");
  forest.parrots = loadImage("parrots_200sq.png");
  document.getElementById("side").style = "visibility:visible";
  document.addEventListener("keyup", keyup, false);
  document.addEventListener("keydown", keydown, false);
  fs.canvas.addEventListener("click", handleClick, true);
  if ('y' === url.searchParams.get('mine')) enterMine(false); // Not from ground
  else forest.map.draw();
  }
  catch(e) { alert(e + "\n\n in forest.init()"); }
}

function checkBox(url, paramName, htmlId)
{ var y = ('y' === url.searchParams.get(paramName)); 
  document.getElementById(htmlId).checked = y;
  return y;
}

function perhapsSet(htmlId, v)
{ var el = document.getElementById(htmlId); // <select>
  el.selectedIndex = -1;
  for (var i = 0; i < el.options.length; i++)
  { if (el.options[i].value === v) el.selectedIndex = i; }
}

function keyup(){ forest.downDone = false; }

function keydown(e)
{ if (forest.lockedUI) return;
  if (forest.showing !== 'tele') e.preventDefault();//EY
  if (forest.downDone) return;//FK
  forest.downDone = true;//FK - first time, if auto-repeating
  if (null !== forest.fwdTimerId) { clearTimeout(forest.fwdTimerId); forest.fwdTimerId = null; }
  if (forest.needOK)
  { if (e.key === 'Enter') doOK();
    return;
  }
  if (forest.telestate === 1 && e.key === 'Enter') { openTele(); return; }
  if (forest.telestate === 2 && e.key === 'Enter') { teleport(); return; }
  var key, me = forest.observer;//EX(me)
  switch (e.key)
  { case 'Down':
    case 'ArrowDown': key = "&#8595;"; break;
    case 'Up':
    case 'ArrowUp': key = "&#8593;"; break;
    case 'Left':
    case 'ArrowLeft': key = "&#8592;"; break;
    case 'Right':
    case 'ArrowRight': key = "&#8594;"; break;
    case 'Enter': key = "&#11152"; break;
    case 'PageDown': if (me.inHeli) { heliDown(); return; }//EX
    case 'PageUp': if (me.inHeli) { heliUp(); return; }//EX
    case 'Escape': if (me.inHeli) { heliExit(); return; }//EX
    default: key = e.key.toLowerCase();
  }
  var buttons;
  switch (forest.showing)
  { case 'scene': buttons = sceneButtons; break;
    case 'map': buttons = mapButtons; break;
    case 'mine': buttons = mineButtons; break;
    case 'minemap': buttons = mineMapButtons; break;
    case 'tele': buttons = teleButtons; break;
  }
  for (var i = 0; i < buttons.length; i++)
  { var b = buttons[i];
    if ((key === b.key || key === b.alt) && !roleWrong(b))
    { b.func();
      break;
} } }//keydown

function autoRun()
{ forest.observer.forward();
  var dt = (forest.observer.inHeli) ? 1e6 / forest.scene.rangeSq : 500;
  forest.fwdTimerId = setTimeout(autoRun, dt);
}

function getMousePoint(e)
{ var cnv = document.getElementById("map");
  return { x: e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - cnv.offsetLeft,
           y: e.clientY + document.body.scrollTop  + document.documentElement.scrollTop  - cnv.offsetTop };
}

function handleClick(e)
{ if (forest.lockedUI) return;
  var me = forest.observer, fsh = forest.showing;
  if (fsh === "map")
  { if (me.role === ROLES.ENGINEER) { handleEngClick(e); return; }//in roads.js
    handleMapClick(e); return;//in map.js
  }
  var pt = getMousePoint(e);
  var ftg = forest.targets;//FB: - any target areas take priority
  for (var i = 0; i < ftg.length; i++)
  { if (ftg [i].contains(pt))
    { ftg [i].act();
      return;
  } }//:FB
  if (fsh === "tele") { teleClick(pt); return; }
  var x = pt.x, y = pt.y;
  if (fsh === "scene" && me.inHeli) //EX:
  { var bs = Object.values(forest.scene.heliButtons);
    for (var i = 0; i < bs.length; i++)
    { var bsi = bs[i];
      if (bsi.isIn(x, y)) 
      { if (null !== bsi.func) bsi.func();
        return;
  } } }// :EX
  var act = null, me = forest.observer, fm = forest.map, wd = fm.wd, ht = fm.ht;
  if (x < wd * 0.1) act = 'LEFT';
  else if (x > 0.9 * wd) act = 'RIGHT';
  else if (y < 0.1 * ht) act = 'UP';
  else if (y > 0.9 * ht) act = 'DOWN';
  else if ((me.nearDoor || me.nearHeli || me.building !== null)
   && x > wd / 2 - 100 && x < wd / 2 + 100 && y > ht / 2 - 100 && y < ht / 2 + 100) act = 'ENTER';
  if (null !== me.inside) { me.inside.handleClick(x, y); return; }
  if (me.rgbMeter)
  { var px = forest.screen.g2.getImageData(x, y, 1, 1).data;
    me.rgbMeter.set(px[0], px[1], px[2]);
    act = 'RGB';
  }
  if (fsh === "map")
  { switch (act)
    {
case 'DOWN': fm.moveDown(); break;
case 'LEFT': fm.moveLeft(); break;
case 'RIGHT': fm.moveRight(); break;
case 'UP': fm.moveUp(); break;
  } }
  else if (fsh === "minemap")
  { fm = forest.mineMap;
    switch (act)
    {
case 'DOWN': fm.moveDown(); break;
case 'LEFT': fm.moveLeft(); break;
case 'RIGHT': fm.moveRight(); break;
case 'UP': fm.moveUp(); break;
  } }
  else if (fsh === "scene")
  { switch (act)
    {
case 'DOWN': me.turnRound(); break;
case 'LEFT': me.turnLeft();  break;
case 'RIGHT': me.turnRight(); break;
case 'UP': me.forward(); break;
case 'ENTER': doEnter(); break;
case 'RGB': me.rgbMeter.draw();
  } }
  else if (fsh === "mine")
  { switch (act)
    {
case 'DOWN': me.turnRound(); break;
case 'LEFT': me.turnLeft();  break;
case 'RIGHT': me.turnRight(); break;
case 'UP': forest.mine.forward(); break;
case 'RGB': me.rgbMeter.draw();
} } }

function centreMapOnObserver() 
{ if (forest.observer.inMine) forest.mineMap.recentre(forest.observer);//ZZ
  else forest.map.recentre(forest.observer);
}

function refocus() { document.getElementById("map").focus (); }
function changeOrient() { forest.map.changeOrient(); }
function changeRange() { forest.scene.changeRange(); refocus (); }
function changeRole() { if (forest.observer) forest.observer.changeRole(); }
function changeStride() { forest.observer.changeStride(); refocus (); }

function changeScroll() 
{ forest.map.changeScroll();
  forest.mineMap.changeScroll();
  if (forest.observer.inMine) forest.mineMap.draw();
  else forest.map.draw();
  refocus();
}
  
function redisplay()
{ switch (forest.showing)
  {
case "scene":
  showButtons(sceneButtons);
  forest.scene.draw(); break;
case "map":
  showButtons(mapButtons);
  forest.map.draw(); break;
case "mine":
  showButtons(mineButtons);
  forest.mine.draw(); break;
case "minemap": 
  showButtons(mineMapButtons);
  forest.mineMap.draw(); break;//ZZ
case "tele": showButtons(teleButtons); break;//RA
} }

function heliUp() { forest.observer.heliUp(); }
function heliDown() { forest.observer.heliDown(); }
function heliExit() { forest.observer.heliExit(); }//EX
function switchMapKind() { forest.map.switchKind(); }
function lockUI() { forest.lockedUI = true; }
function unlockUI() { forest.lockedUI = false; }

function toMap()
{ if (null !== forest.fwdTimerId) { clearTimeout(forest.fwdTimerId); forest.fwdTimerId = null; }
  var me = forest.observer, fm;
  if (forest.showing === "scene")//EX
  { var fs = forest.screen;
    forest.sceneCache = fs.g2.getImageData(0, 0, fs.wd, fs.ht);
  }
  if (me.inMine)
  { forest.showing = "minemap";
    fm = forest.mineMap;
  }
  else
  { forest.showing = "map";
    fm = forest.map;
  }
  fm.setButtons();
  fm.draw();
}

function toScene()
{ var me = forest.observer;
  if (me.inMine)
  { forest.showing = "mine";
    forest.mine.setButtons();
    forest.mine.draw();
  }
  else
  { forest.showing = "scene";
    forest.scene.setButtons();
    if (null === me.inside) forest.scene.draw();
    else me.inside.draw();
} }

function loadImage(fileName)
{ var im = new Image();
  im.loaded = false;
  im.onerror = function()
  { forest.infoDiv.innerHTML = 
      '<span style="color:#f00">ERROR: Failed to load ' + fileName + '</span>';
  };
  im.onload = function()
  { if (im.width === undefined || im.width <= 0) alert("Failed to load " + fileName);
    else
    { im.loaded = true;
      im.foggy = new Array(8);
      im.foggy[0] = im;
      forest.workarea.getImageData(im);
    }
  };
  im.src = "im/" + fileName;
  return im;
}

function lookUp() 
{ if (forest.needOK) return;
  if (forest.observer.inside === null)
  { switch (forest.showing)
    { 
case "scene": forest.scene.lookUp(); break;
case "mine": forest.mine.lookUp(); break; 
  } } 
  else forest.observer.inside.lookUp(); 
}

function lookLevel() 
{ if (forest.needOK) return;
  if (forest.observer.inside === null)
  { switch (forest.showing)
    { 
case "scene": forest.scene.lookLevel(); break;
case "mine": forest.mine.lookLevel(); break; 
  } } 
  else forest.observer.inside.lookLevel(); 
}

function lookDown() 
{ if (forest.needOK) return;
  if (forest.observer.inside === null) 
  { switch (forest.showing)
    { 
case "scene": forest.scene.lookDown(); break;
case "mine": forest.mine.lookDown(); break; 
  } } 
  else forest.observer.inside.lookDown(); 
}

function message()//RA: 1st parameter may be an array of strings
{ let n = arguments.length;
  if(n > 0)
  { let ROW_HT = 25, MARGIN = 10, parts = [];
    forest.needOK = false;
    if (arguments[n - 1] === true)
    { forest.needOK = true;
      n--;
    }
    if (typeof(arguments[0]) !== "string")//It must be an array, in this design
    { for (let i = 0; i < arguments[0].length; i++) parts.push(arguments[0][i]);
    }
    else
    { for (let i = 0; i < n; i++) parts.push(arguments[i]);
    }
    if (forest.needOK)
    { parts.push("");
      parts.push("Press OK (key Enter) to continue");
    }
    n = parts.length;
    let fs = forest.screen, g2 = fs.g2;
    g2.font = (ROW_HT - 5) + "px sans-serif";
    let maxWd = 0;
    for (let i = 0; i < n; i++)
    { let tx = g2.measureText(parts[i]);
      if (tx.width > maxWd) maxWd = tx.width;
    }
    let wd = fs.wd, ht2 = fs.ht / 2;
    let xL = (wd - maxWd) / 2 - MARGIN;
    let xR = (wd + maxWd) / 2 + MARGIN;
    let txHt2 = ROW_HT * n / 2 + MARGIN;
    let yT = ht2 - txHt2, yB = ht2 + txHt2;
    g2.fillStyle = "#fff";
    g2.strokeStyle = "#999";
    g2.lineWidth = 4;
    g2.beginPath();
    g2.moveTo(xL, yT);
    g2.lineTo(xR, yT);
    g2.lineTo(xR, yB);
    g2.lineTo(xL, yB);
    g2.closePath();
    g2.fill();
    g2.stroke();
    let x = xL + 10, y = yT + ROW_HT;
    g2.fillStyle = "#000";
    for (let i = 0; i < n; i++) { g2.fillText(parts[i], x, y); y += ROW_HT; }
    g2.lineWidth = 1;
    if (forest.needOK)
    { forest.buttonsDiv.innerHTML =
'<input class="button" type="button" onclick="doOK()" value="OK (key Enter)"/> ';
      document.getElementById("sideButtons").innerHTML = "";
      document.getElementById("extraButtons").innerHTML = "";
} } }// message

function doOK() 
{ forest.needOK = false;
  forest.downDone = false;//Just to be sure
  forest.lockedUI = false;// ..
  switch (forest.showing)
  { case "scene": showButtons(sceneButtons); break;
    case "map": showButtons(mapButtons); break;
    case "mine": showButtons(mineButtons); break;
    case "minemap": showButtons(mineMapButtons); break;
  }
  redisplay();
}

function fillTriangle(g2, x0, y0, x1, y1, x2, y2)
{ g2.beginPath();
  g2.moveTo(x0, y0);
  g2.lineTo(x1, y1);
  g2.lineTo(x2, y2);
  g2.closePath();
  g2.fill();
}

function strokeLine(g2, x0, y0, x1, y1)
{ g2.beginPath();
  g2.moveTo(x0, y0);
  g2.lineTo(x1, y1);
  g2.stroke();
}

function showButtons(buttons)
{ let i, b, sideDivs = '', belowDivs = '';
  let extraDivs = '<div class="button linkButton"><a href="help.html" target="_blank">Help</a></div>';
  for (i = 0; i < buttons.length; i++)
  { b = buttons[i];
    switch (b.kind)
    {
case 'side': sideDivs += makeDiv(b); break;
case 'below':
case 'small': belowDivs += makeDiv(b); break;
case 'extra': extraDivs += makeDiv(b); break;
  } }
  document.getElementById("sideButtons").innerHTML = sideDivs;
  document.getElementById("belowButtons").innerHTML = belowDivs;
  document.getElementById("extraButtons").innerHTML = extraDivs;
  for (i = 0; i < buttons.length; i++)
  { b = buttons[i];
    if (!roleWrong(b)) document.getElementById(b.id).addEventListener('click', b.func);
} }

function roleWrong(b)
{ if (undefined !== b.roles)
  { switch (forest.observer.role)
    {
case ROLES.EXPLORER: return (-1 === b.roles.indexOf("e"));
case ROLES.ARCHAEOLOGIST: return (-1 === b.roles.indexOf("a"));
case ROLES.LOCKSMITH: return (-1 === b.roles.indexOf("l"));
case ROLES.ENGINEER: return (-1 === b.roles.indexOf("g"));
case ROLES.MAGICIAN: return (-1 === b.roles.indexOf("m"));
case ROLES.GANGSTER: return (-1 === b.roles.indexOf("r"));
case ROLES.PILOT: return (-1 === b.roles.indexOf("i"));
case ROLES.PARACHUTIST: return (-1 === b.roles.indexOf("p"));
  } }
  return false;
}

function makeDiv(b)
{ if (roleWrong(b)) return '';
  var s = '<div class="button ' + b.kind + 'Button" id="' + b.id + '"';
  if (undefined !== b.style) s += ' style="' + b.style + '"';
  if (undefined !== b.alt) s += ' title="Alternative key: ' + b.alt + '"'; 
  return s + '>' + b.text + '<br/><br/>' + b.key + '</div>';
}

function doLeft() { forest.observer.turnLeft(); }
function doUp() { if (forest.showing === "mine") forest.mine.forward(); else forest.observer.forward(); }
function doRight() { forest.observer.turnRight(); }
function doDown() { forest.observer.turnRound(); }

function doEnter() 
{ if (forest.needOK) doOK();
  else forest.observer.doEnter(); 
}

function doJump() 
{ delete forest.sceneCache;//EX
  forest.map.jumpToCentre();
}

function doFound() { forest.observer.showFound(); }
function doMapW() { if (forest.observer.inMine) forest.mineMap.moveLeft(); else forest.map.moveLeft(); }
function doMapN() { if (forest.observer.inMine) forest.mineMap.moveUp(); else forest.map.moveUp(); }
function doMapE() { if (forest.observer.inMine) forest.mineMap.moveRight(); else forest.map.moveRight(); }
function doMapS() { if (forest.observer.inMine) forest.mineMap.moveDown(); else forest.map.moveDown(); }

const sceneButtons = [
{ kind:'below', id:"turnLeft", text:"Turn left", key:"&#8592;", alt:'a', func:doLeft },
{ kind:'below', id:"forward", text:"Go forward", key:"&#8593;", alt:'w', func:doUp },
{ kind:'below', id:"turnRight", text:"Turn right", key:"&#8594;", alt:'d', func:doRight },
{ kind:'below', id:"turnBack", text:"Turn round", key:"&#8595;", alt:'s', func:doDown },
{ kind:'side', id:"found", text:"Found so far", key:"f", func:doFound },
{ kind:'side', id:"lookUp", text:"Look up", key:"+", alt:'=', func:lookUp, style:"margin-top:23px" },
{ kind:'side', id:"lookLevel", text:"Look level", key:"0", func:lookLevel },
{ kind:'side', id:"lookDown", text:"Look down", key:"-", func:lookDown },
{ kind:'side', id:"toMap", text:"Show map", key:"m", func:toMap, style:"margin-top:23px" },
{ kind:'extra', id:"auto", text:"Auto-run", key:"u", func:autoRun, roles:"ei" },
{ kind:'extra', id:"enter", text:"Enter", key:"&#11152", func:doEnter }
];
const mapButtons = [
{ kind:'below', id:"panLeft", text:"Go WEST", key:"&#8592;", alt:'a', func:doMapW },
{ kind:'below', id:"scrUp", text:"Go NORTH", key:"&#8593;", alt:'w', func:doMapN },
{ kind:'below', id:"panRight", text:"Go EAST", key:"&#8594;", alt:'d', func:doMapE },
{ kind:'below', id:"scrDown", text:"Go SOUTH", key:"&#8595;", alt:'s', func:doMapS },
{ kind:'side', id:"found", text:"Found so far", key:"f", func:doFound },
{ kind:'side', id:"centreMap", text:"Centre map on me", key:"c", func:centreMapOnObserver,
    style:"margin-top:286px" },
{ kind:'side', id:"toScene", text:"Show scene", key:"m", func:toScene, style:"margin-top:20px" },
{ kind:'extra', id:"jump", text:"Jump", key:"j", func:doJump, roles:"p" }
];
const mineButtons = [
{ kind:'below', id:"turnLeft", text:"Turn left", key:"&#8592;", alt:'a', func:doLeft },
{ kind:'below', id:"forward", text:"Go forward", key:"&#8593;", alt:'w', func:doUp },
{ kind:'below', id:"turnRight", text:"Turn right", key:"&#8594;", alt:'d', func:doRight },
{ kind:'below', id:"turnBack", text:"Turn round", key:"&#8595;", alt:'s', func:doDown },
{ kind:'side', id:"lookUp", text:"Look up", key:"+", alt:'=', func:lookUp, style:"margin-top:120px" },
{ kind:'side', id:"lookLevel", text:"Look level", key:"0", func:lookLevel },
{ kind:'side', id:"lookDown", text:"Look down", key:"-", func:lookDown },
{ kind:'side', id:"toMap", text:"Show map", key:"m", func:toMap, style:"margin-top:20px" },
{ kind:'extra', id:"enter", text:"Enter", key:"&#11152", func:doEnter }
];
const mineMapButtons = [
{ kind:'below', id:"panLeft", text:"Go WEST", key:"&#8592;", alt:'a', func:doMapW },
{ kind:'below', id:"scrUp", text:"Go NORTH", key:"&#8593;", alt:'w', func:doMapN },
{ kind:'below', id:"panRight", text:"Go EAST", key:"&#8594;", alt:'d', func:doMapE },
{ kind:'below', id:"scrDown", text:"Go SOUTH", key:"&#8595;", alt:'s', func:doMapS },
{ kind:'side', id:"centreMap", text:"Centre map on me", key:"c", func:centreMapOnObserver, style:"margin-top:240px" },
{ kind:'side', id:"toScene", text:"Show scene", key:"m", func:toScene, style:"margin-top:20px" }
];