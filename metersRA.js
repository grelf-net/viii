// Part of The Forest
// Copyright (c) Graham Relf, UK, 2019-24
// www.grelf.net
'use strict';
const PIBY2 = Math.PI * 0.5;

function HeliMeter()
{ this.wd = this.ht = 30;
  this.cr = 5;
}

HeliMeter.prototype.draw = function(nHelis)// On map
{ this.drawAt(forest.screen.wd - 10 - this.wd, 10, nHelis);
};

HeliMeter.prototype.drawAt = function(xLeft, yTop, nHelis)
{ let g2 = forest.screen.g2;
  g2.fillStyle = '#777';
  g2.strokeStyle = '#000';
  drawRoundedRect(g2, xLeft, yTop, this.wd, this.ht, 10);
  g2.lineWidth = 2;
  if (nHelis > 0) g2.strokeStyle = '#f00';
  strokeLine(g2, xLeft + 8, yTop + 8, xLeft + this.wd - 8, yTop + this.ht - 8);
  strokeLine(g2, xLeft + this.wd - 8, yTop + 8, xLeft + 8, yTop + this.ht - 8);
};

function MetalDetector()
{ this.wd = 200; this.ht = 200; this.cr = 10;
  this.hit = false;
}

MetalDetector.prototype.draw = function()//On scene
{ let fs = forest.screen, g2 = fs.g2;
  let xLeft = fs.wd - 10 - this.wd, yTop = fs.ht - 150;
  g2.fillStyle = '#777';
  g2.strokeStyle = '#000';
  drawRoundedRect(g2, xLeft, yTop, this.wd, this.ht, 10);
  g2.fillStyle = '#a4aa8f';
  g2.fillRect(xLeft + 20, yTop + 20, this.wd - 40, fs.ht - yTop - 20);
  g2.fillStyle = '#555';
  g2.font = 'bold 60px sans-serif';
  let s = this.hit ? 'HIT' : '_ _';
  g2.fillText(s, xLeft + 50, yTop + 100);
};

function RgbMeter() 
{ this.r = 0; this.g = 0; this.b = 0; this.measured = false;
  this.wd = 200; this.ht = 65; this.cr = 10; // corner radius 
}

RgbMeter.prototype.set = function(r, g, b) 
{ this.r = r; this.g = g; this.b = b; this.measured = true; };

RgbMeter.prototype.draw  = function()// On scene
{ this.drawAt(forest.screen.wd - 10 - this.wd, 10);
};  

RgbMeter.prototype.drawAt = function(xLeft, yTop)
{ let g2 = forest.screen.g2;
  g2.fillStyle = '#777';
  g2.strokeStyle = '#000';
  drawRoundedRect(g2, xLeft, yTop, this.wd, this.ht, 10);
  g2.fillStyle = '#fff';
  g2.font = 'bold 12px sans-serif';
  g2.fillText('R', xLeft + 60, yTop + 15);
  g2.fillText('G', xLeft + 110, yTop + 15);
  g2.fillText('B', xLeft + 160, yTop + 15);
  g2.fillText('Dec', xLeft + 10, yTop + 33);
  g2.fillRect(xLeft + 50, yTop + 20, 40, 16);
  g2.fillRect(xLeft + 100, yTop + 20, 40, 16);
  g2.fillRect(xLeft + 150, yTop + 20, 40, 16);
  if (this.measured)
  { g2.fillText('Hex', xLeft + 10, yTop + 53);
    g2.fillRect(xLeft + 50, yTop + 40, 40, 16);
    g2.fillRect(xLeft + 100, yTop + 40, 40, 16);
    g2.fillRect(xLeft + 150, yTop + 40, 40, 16);
    g2.fillStyle = '#000';
    g2.fillText(this.r, xLeft + 54, yTop + 32);
    g2.fillText(this.g, xLeft + 104, yTop + 32);
    g2.fillText(this.b, xLeft + 154, yTop + 32);
    g2.fillText(this.code(this.r), xLeft + 54, yTop + 52);
    g2.fillText(this.code(this.g), xLeft + 104, yTop + 52);
    g2.fillText(this.code(this.b), xLeft + 154, yTop + 52);
  }
  else g2.fillText('Click on something', xLeft + 10, yTop + 53);
};

RgbMeter.prototype.code = function(x) 
{ if (x < 16) return "0" + x.toString(16)
  return x.toString(16);
};

function drawRoundedRect(g2, xLeft, yTop, width, height, cr)
{ let xOutL = xLeft, xOutR = xLeft + width;
  let yOutT = yTop, yOutB = yTop + height;
  let xInL = xOutL + cr, xInR = xOutR - cr;
  let yInT = yOutT + cr, yInB = yOutB - cr;
  g2.beginPath ();
  g2.moveTo (xInL, yOutT);
  g2.lineTo (xInR, yOutT);
  g2.arc (xInR, yInT, cr, 3 * PIBY2, 0);
  g2.lineTo (xOutR, yInB);
  g2.arc (xInR, yInB, cr, 0, PIBY2);
  g2.lineTo (xInL, yOutB);
  g2.arc (xInL, yInB, cr, PIBY2, Math.PI);
  g2.lineTo(xOutL, yInT);
  g2.arc (xInL, yInT, cr, Math.PI, 3 * PIBY2);
  g2.closePath();
  g2.fill();
  g2.stroke();
}