// Part of Pieces of 8
// For draggable mapclick div, used by both roads (engineer) and map
// Copyright (c) Graham Relf, UK, 2024
// www.grelf.net
'use strict';

function MapUI(html)
{ this.ui = document.getElementById("mapclick");
  this.ui.innerHTML = html;
  this.show();
  this.title = document.getElementById("divtitle");
  this.titleWd = this.title.offsetWidth;
  this.titleHt = this.title.offsetHeight;
  this.titleDown = false;
  this.title.addEventListener('mousedown', uiDown);
  this.title.addEventListener('mousemove', uiMove);
  this.title.addEventListener('mouseup', uiUp);// }same
  this.title.addEventListener('mouseout', uiUp);//}
}

MapUI.prototype.show = function() { this.ui.style.visibility = "visible"; }
MapUI.prototype.hide = function() { this.ui.style.visibility = "hidden"; }

function uiClose() { forest.mapui.hide(); }

function uiDown(e)
{ let fm = forest.mapui;
  fm.titleDown = true;
  fm.uiLeft = fm.ui.offsetLeft;
  fm.uiTop = fm.ui.offsetTop;
  let pt = getMousePoint(e);
  fm.uiX = pt.x;
  fm.uiY = pt.y;
}

function uiMove(e)
{ let fm = forest.mapui;
  if (!fm.titleDown) return;
  let pt = getMousePoint(e);
  let x = pt.x, y = pt.y;
  if (x > fm.uiLeft && x < fm.uiLeft + fm.titleWd 
   && y > fm.uiTop && y < fm.uiTop + fm.titleHt)
  { fm.uiLeft += x - fm.uiX;
    fm.ui.style.left = fm.uiLeft + "px";
    fm.uiTop += y - fm.uiY;
    fm.ui.style.top = fm.uiTop + "px";
    fm.uiX = x;
    fm.uiY = y;
} }

function uiUp(e) { forest.mapui.titleDown = false; }
