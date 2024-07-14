// Part of The Forest
// Copyright (c) Graham Relf, UK, 2014-24
// www.grelf.net
'use strict';
const ROLES = { EXPLORER:0, ARCHAEOLOGIST:1, LOCKSMITH:2, ENGINEER:3,
  MAGICIAN:4, GANGSTER:5, PARACHUTIST:6, PILOT:7 };

// position has 2 properties: x, y. bearing in degrees clockwise from N
function Observer(position, bearing)
{ this.role = ROLES.EXPLORER;
  document.getElementById("role").selectedIndex = 0;
  this.COMPASS_RADIUS_PX = 40;
  this.SAFE_HELI_HT = 50;
  this.x = position.x;
  this.y = position.y;
  this.b = bearing;
  this.ME_HT = 2;//Observer height, m
  this.DB = 15;
//  this.DRIFT = true;
  this.ht = this.ME_HT;
  this.sincos();
  this.stride = 3;//m
  document.getElementById("stride").selectedIndex = 2;
  this.building = null;
  this.inside = null;
  this.nearDoor = false;
  this.nearHeli = false;
  this.inMine = false;//ZY
  this.inHeli = false;
  this.HELI_STEP = 10;
  this.HELI_DALT = 10;
  this.swimming = false;
  this.nPieces = 0;//RA
  this.phoneButton = false;//RA
}

// Calculate frequently needed fields
Observer.prototype.sincos = function()
{ this.b = Math.round(this.b) % 360; // Always >= 0, integer
  var brad = this.b * DEG2RAD;
  this.sinb = Math.sin (brad);
  this.cosb = Math.cos (brad);
};

Observer.prototype.getHt10mAhead = function()
{ var x = this.x + 10 * this.sinb;
  var y = this.y + 10 * this.cosb;
  return forest.terrain.terra(x, y).height;
};

Observer.prototype.toString = function()
{ var s = "x = " + this.x.toFixed(2) + ", y = " + this.y.toFixed(2) +
    ", bearing " + this.b + "\u00b0";
  if (forest.showing === "scene" && !this.inHeli) 
  { s += ", steepness = " + Math.round(this.dht); }
  return s;
};

Observer.prototype.changeStride = function()
{ var el = document.getElementById("stride");
  this.stride = parseInt(el.options[el.selectedIndex].value);
  refocus();
};

Observer.prototype.changeRole = function()
{ if (null !== forest.fwdTimerId) { clearTimeout(forest.fwdTimerId); forest.fwdTimerId = null; }
  delete forest.sceneCache;
  document.getElementById("results").innerHTML = '';
  var ft = forest.terrain;
  ft.lakeHt = ft.LAKE_HT0;
  this.inHeli = false;
  this.ht = this.ME_HT;
  lookLevel();
  var el = document.getElementById("role");
  switch (el.options[el.selectedIndex].value)
  {
case 'A': this.role = ROLES.ARCHAEOLOGIST; break;
case 'L': this.role = ROLES.LOCKSMITH; break;
case 'G': this.role = ROLES.ENGINEER; break;
case 'M': this.role = ROLES.MAGICIAN; break;
case 'R': this.role = ROLES.GANGSTER; break;
case 'P': this.role = ROLES.PARACHUTIST; break;
case 'I': this.role = ROLES.PILOT; break;
default: this.role = ROLES.EXPLORER;
  }
  refocus();
//RA  toMap();
  redisplay();//RA
};

Observer.prototype.drawCompass = function()
{ var g2 = forest.screen.g2;
  var xCentre = forest.screen.wd * 0.5;
  var yCentre = forest.screen.ht - this.COMPASS_RADIUS_PX - 5;
  var lw = g2.lineWidth;
  g2.beginPath();
  g2.arc(xCentre, yCentre, this.COMPASS_RADIUS_PX, 0, TWO_PI, false);
  g2.closePath();
  g2.fillStyle = "#ccc";
  g2.strokeStyle = "#333";
  g2.fill();
  g2.stroke();
  g2.lineWidth = 5; // px
  var r5 = this.COMPASS_RADIUS_PX - 5;
  var dx = -r5 * this.sinb;
  var dy = -r5 * this.cosb;
  g2.strokeStyle = "#fff";
  g2.beginPath();
  g2.moveTo(xCentre, yCentre);
  g2.lineTo(xCentre - dx, yCentre - dy);
  g2.closePath();
  g2.stroke();
  g2.strokeStyle = "#c00";
  g2.beginPath();
  g2.moveTo(xCentre, yCentre);
  g2.lineTo(xCentre + dx, yCentre + dy);
  g2.closePath();
  g2.stroke();
  g2.lineWidth = lw; // Restore previous
  if (this.rgbMeter) this.rgbMeter.draw();
  if (this.role === ROLES.ARCHAEOLOGIST && this.metalDet) this.metalDet.draw();
};

Observer.prototype.forward = function()
{ var step;
  if (this.inHeli)
  { if (this.ht <= this.ME_HT) return;//On ground: no forward till exit
    else step = this.HELI_STEP;
  }
  else
  { var ft = forest.terrain, tr0 = ft.terra(this.x, this.y).terrain;
/*    if (this.DRIFT && tr0 !== TERRAINS.TOWN && tr0 !== TERRAINS.ROAD) 
    { this.b += Math.round (10 * Math.random ()) - 5; // Drift +- 5 degrees
      this.sincos ();
    }*/
    step = this.stride;
    switch (tr0)
    {
    case TERRAINS.THICKET:
    case TERRAINS.MARSH:
    case TERRAINS.MUD:
    case TERRAINS.SNOW:
    case TERRAINS.LAKE: step *= 0.2; break;
    case TERRAINS.MOOR: step *= 0.5; break;
    }
    var steepnessFactor = 1;
    if (this.dht > 30) steepnessFactor = 0.1;
    else if (this.dht > 20) steepnessFactor = 0.2;
    else if (this.dht > 10) steepnessFactor = 0.5;
    else if (this.dht < -30) steepnessFactor = 0.2;
    else if (this.dht < -20) steepnessFactor = 0.5;
    else if (this.dht < -10) steepnessFactor = 1.2;
    step *= steepnessFactor;
  }
  var xNew = this.x + step * this.sinb;
  var yNew = this.y + step * this.cosb;
  if (this.inHeli)
  { if (this.ht - this.ME_HT < this.SAFE_HELI_HT 
     && forest.terrain.terra(xNew, yNew).terrain === TERRAINS.TOWN) heliSafer();
  }
  else if (null === this.inside && inABuilding(xNew, yNew)) 
  { message(
'You cannot walk through buildings!',
'But you may Enter the door.'); return;
  }
  this.x = xNew;
  this.y = yNew;
  this.dist_m += step;
  if (forest.rain > 0) forest.rain--;//RA
  if (forest.share) forest.share.postMessage("setO:" +
      JSON.stringify({x:this.x, y:this.y, b:this.b}));
  let msg = [];
  if (this.role === ROLES.ARCHAEOLOGIST && null !== this.metalDet)
  { let dd = 8, xr = Math.round(xNew), yr = Math.round(yNew);
    this.metalDet.hit = false;
    for (let ix = xr - dd; ix <= xr + dd; ix++)
    { for (let iy = yr - dd; iy <= yr + dd; iy++)
      { if (ft.atPlace(ix, iy) === FEATURES.METAL)
        { this.metalDet.hit = true
          ft.remove(ix, iy);//Don't find it again
          this.nPieces++;
          if (this.nPieces >= 8) this.showWin();
          else msg =
["You have found a piece",
"so you now have " + this.nPieces + " of them.","",
"We have assumed that as",
"an archaeologist you",
"have a digging tool."];
  } } } }
  if (null === this.inside) 
  { forest.scene.draw();
    if (msg.length > 0) message(msg, true);
  }
  else this.inside.checkAndDraw();
};

Observer.prototype.showFound = function()
{ if (this.nPieces >= 8) this.showWin();
  let fs = forest.screen, g2 = fs.g2;
  g2.fillStyle = forest.scene.cssSUN;
  g2.fillRect(0, 0, fs.wd, fs.ht);
  g2.font = "normal 32px serif";
  g2.fillStyle = "#69b";
  g2.fillText(forest.url, 8, 40);
  g2.fillStyle = '#00b';
  if (this.nPieces === 0 && !this.rgbMeter && !this.heliMeter && !this.metalDet)
  { g2.fillText("You have not found anything yet", 8, 100);
  }
  else
  { g2.fillText("So far you have found these", 8, 100);
    let y = 170;
    if (this.rgbMeter) this.rgbMeter.drawAt(8, y);
    if (this.heliMeter) this.heliMeter.drawAt(250, y, 1);
    if (this.metalDet) g2.drawImage(forest.mine.imMetalDet, 320, y);
    if (this.phoneButton) g2.drawImage(forest.mine.imPhone, 650, y, 70, 90);
    if (this.nPieces > 0)
    { y = 400;
      for (let i = 0; i < this.nPieces; i++)
      { g2.drawImage(forest.coinR1, 10 + i * 80, y, 70, 70);
  } } }
  g2.drawImage(forest.parrots, 600, 400);
  forest.needOK = true;
  forest.buttonsDiv.innerHTML =
'<input class="button" type="button" onclick="doOK()" value="OK (key Enter)"/> ';
  document.getElementById("sideButtons").innerHTML = "";
  document.getElementById("extraButtons").innerHTML = "";
};

Observer.prototype.showWin = function()
{ winBackground();
  let fad = {coins:[], nSteps:40, stepNo:0};
  let c8x = 400, c8y = 300;//Centre of coinR8 when shown
  let a = 45 * DEG2RAD;//8 around circle
  let r8 = forest.coinR8.width / 2;
  let r1 = 35, dr = r8 - r1;
  for (let i = 0; i < 8; i++)
  { let x0 = 10 + i * 80, y0 = 400;//Starting px
    let ai = a * i;
    let tx = c8x + dr * Math.cos(ai), ty = c8y + dr * Math.sin(ai);//Target px
    let dx = (tx - (x0 + r1)) / fad.nSteps, dy = (ty - (y0 + r1)) / fad.nSteps;
    forest.screen.g2.drawImage(forest.coinR1, x0, y0, 70, 70);
    fad.coins.push({x0:x0, y0:y0, dx:dx, dy:dy});
  }  
  forest.animData = fad;
  setTimeout(winAnim, 500);
}

function winBackground()
{ let fs = forest.screen, g2 = fs.g2;
  g2.fillStyle = forest.scene.cssSUN;
  g2.fillRect(0, 0, fs.wd, fs.ht);
  g2.font = "normal 32px serif";
  g2.fillStyle = "#69b";
  g2.fillText(forest.url, 8, 40);
  g2.fillStyle = '#00b';
  g2.fillText("YOU WIN!", 8, 90);
  g2.drawImage(forest.parrots, 600, 100);
}

function winAnim()
{ winBackground();
  let g2 = forest.screen.g2, fad = forest.animData;
  let s = fad.stepNo;
  for (let i = 0; i < 8; i++)
  { let c = fad.coins[i];
    g2.drawImage(forest.coinR1, c.x0 + c.dx * s, c.y0 + c.dy * s, 70, 70);
  }
  fad.stepNo++;
  if (fad.stepNo < fad.nSteps) setTimeout(winAnim, 80);
  else winEnd();
}

function winEnd() 
{ winBackground();
  let g2 = forest.screen.g2;
  g2.drawImage(forest.coinR8, 225, 125);
  g2.font = "normal 16px serif";
  g2.fillText("8 Reales = 1 Spanish silver dollar", 8, 550);
  g2.font = "normal 12px serif";
  g2.fillStyle = "#69b";
  g2.fillText("Dollar image by Sgh - Own work, CC BY-SA 4.0," +
"https://commons.wikimedia.org/w/index.php?curid=45282808", 8, 580);
};

function heliSafer()// Get above buildings
{ lockUI();
  var me = forest.observer, fs = forest.scene;
  if (me.ht - me.ME_HT < me.SAFE_HELI_HT)
  { me.ht += 5;
    fs.draw();
    fs.setButtons();
    setTimeout(heliSafer, 5);
  }
  else unlockUI();
}

Observer.prototype.jumpTo = function(position)
{ this.x = position.x;
  this.y = position.y;
  if (forest.share) forest.share.postMessage("setO:" +
      JSON.stringify({x:this.x, y:this.y, b:this.b}));
  forest.map.jumpTo(position);
  toScene();
};

Observer.prototype.turnLeft = function()
{ var tt = forest.terrain.terra(this.x, this.y).terrain;
  if (tt === TERRAINS.TOWN || tt === TERRAINS.ROAD || tt === TERRAINS.PATH) this.b -= this.DB * 0.5;
  else this.b -= this.DB;
  this.sincos ();
  if (forest.rain > 0) forest.rain--;//RA
  if (forest.share) forest.share.postMessage("setO:" +
      JSON.stringify({x:this.x, y:this.y, b:this.b}));
  if (forest.showing === "mine") forest.mine.draw();
  else if (null === this.inside) forest.scene.draw(); else this.inside.draw();
};

Observer.prototype.turnRight = function()
{ var tt = forest.terrain.terra(this.x, this.y).terrain;
  if (tt === TERRAINS.TOWN || tt === TERRAINS.ROAD || tt === TERRAINS.PATH) this.b += this.DB * 0.5;
  else this.b += this.DB;
  this.sincos();
  if (forest.rain > 0) forest.rain--;//RA
  if (forest.share) forest.share.postMessage("setO:" +
      JSON.stringify({x:this.x, y:this.y, b:this.b}));
  if (forest.showing === "mine") forest.mine.draw();
  else if (null === this.inside) forest.scene.draw(); else this.inside.draw();
};

Observer.prototype.turnRound = function()
{ this.b += 180; this.sincos();
  if (forest.rain > 0) forest.rain--;//RA
  if (forest.share) forest.share.postMessage("setO:" +
      JSON.stringify({x:this.x, y:this.y, b:this.b}));
  if (forest.showing === "mine") forest.mine.draw();
  else if (null === this.inside) forest.scene.draw(); else this.inside.draw();
};

Observer.prototype.doEnter = function()
{ if (this.nearDoor) forest.scene.openDoor();
  else if (this.building !== null) this.building.enter();
  else if (this.nearHeli && this.role === ROLES.PILOT)
  { var xr = Math.round(this.x), yr = Math.round(this.y), ft = forest.terrain;
    for (var iy = yr - 8; iy <= yr + 8; iy++)
    { for (var ix = xr - 8; ix <= xr + 8; ix++)
      { if (ft.terra(ix, iy).feature === FEATURES.CONE) ft.place(ix, iy, FEATURES.NONE);
    } }
    this.inHeli = true; this.heliUp();
  }
  else if (null !== this.spTele) enterTele();
};

Observer.prototype.heliUp = function()
{ this.ht += this.HELI_DALT;
  forest.scene.setButtons();
  forest.scene.draw();
};

Observer.prototype.heliDown = function ()
{ var ft = forest.terrain;
  var tr = ft.terra(this.x, this.y).terrain;
  if (tr === TERRAINS.TOWN && this.ht - this.ME_HT <= this.SAFE_HELI_HT)
  { message("It's not safe to go lower", "over buildings or paving"); return; }
  if (this.ht - this.HELI_DALT <= this.ME_HT)
  { if (tr !== TERRAINS.GRASS && tr !== TERRAINS.MOOR)
    { message("You cannot land here, only", "on open land (grass or moor)"); return; }
  }
  this.ht -= this.HELI_DALT;
  if (this.ht <= this.ME_HT) 
  { this.ht = this.ME_HT; }
  forest.scene.setButtons();
  forest.scene.draw();
};

Observer.prototype.heliExit = function()//EX - user now has to disembark
{ if (this.ht <= this.ME_HT) 
  { this.ht = this.ME_HT;
    this.inHeli = false;
    var st = this.stride;
    this.stride = 10;// Move clear of heli
    this.forward();
    this.stride = st;
    forest.terrain.place(Math.round(this.x), Math.round(this.y), FEATURES.CONE);
  }
  forest.scene.draw();
};