// Part of Random Lands
// Copyright (c) Graham Relf, UK, 2024
// www.grelf.net
'use strict';

function initSaveLoad()
{ if (storageAvailable("localStorage"))
  { let sv = {kind:'extra',id:"save",text:"Save game",key:"v", func:saveGame};
    let ld = {kind:'extra',id:"load",text:"Load game",key:"o", func:loadGame};
    let cs = {kind:'extra',id:"clear",text:"Clear saved",key:"z", func:clearStore};
    mapButtons.push(sv);
    mapButtons.push(ld);
    mapButtons.push(cs);
    sceneButtons.push(sv);
    sceneButtons.push(ld);
    sceneButtons.push(cs);
    mineButtons.push(sv);
    mineButtons.push(ld);
    mineButtons.push(cs);
    mineMapButtons.push(sv);
    mineMapButtons.push(ld);
    mineMapButtons.push(cs);
    localStorage.setItem('example', EG_JSON);//already stringified
    localStorage.setItem('names', JSON.stringify(['example']));
} }

function clearStore()
{ if (!storageAvailable('localStorage')) unavail();
  else
  { let nameList = localStorage.getItem('names');
    if (null === nameList) return;
    nameList = JSON.parse(nameList);
    let s = "Saved games: ";
    for (let i = 0; i < nameList.length; i++)
    { s += '\n' + (i + 1) + '  ' + nameList[i];
    }
    let req = prompt(s + '\n\nWhich number to delete?\nOr number 0 for all');
    if (null !== req && req.length > 0)
    { req = parseInt(req) - 1;
    }
    else return;
    if (req === -1)
    { if (confirm("Clear all saved games - are you sure?")) localStorage.clear();
      return;    
    }
    if (req > 0 && req < nameList.length)
    { localStorage.removeItem(nameList[req]);
      nameList.splice(req, 1);
      localStorage.setItem('names', JSON.stringify(nameList));
} } }

function getNameList()
{ let nameList = localStorage.getItem('names');
  if (null === nameList) return [];// new list
  else return JSON.parse (nameList);
}
    
function saveGame ()
{ if (!storageAvailable ('localStorage')) unavail();
  else
  { let name = prompt("Give a name for the game");
    if (null === name || name.length === 0) return;
    let nameList = getNameList();
    for (let i = 0; i < nameList.length; i++)
    { if (nameList[i] === name)
      { if (confirm("There is already a saved\ngame called " + name + "\n\nOVERWRITE?"))
        { nameList.splice(i, 1);
          localStorage.removeItem(name);
          localStorage.setItem('names', JSON.stringify(nameList));
        }
        else return;
    } }
    saveGameAs(name);
} }// saveGame

function saveGameAs(name)
{
  let me = forest.observer, ft = forest.terrain, fs = forest.scene;
  let state = 
  { x:me.x, y:me.y, b:me.b, heli:me.inHeli, ht:me.ht, stride:me.stride,
    pieces:me.nPieces, htBase:fs.htBase, range:fs.range_m,
    inside:(null === me.inside) ? null : {x:me.inside.xC, y:me.inside.yC}, // Building centre
    teles:forest.tele.sites, bleak:ft.bleak, lakeHt:ft.lakeHt, lakeHt0:ft.LAKE_HT0, 
    profile:ft.PROFILE, snowHt:ft.snowHt, roads:ft.roads, 
    show:forest.showing, rgb:me.rgbMeter ? true : false,
    helimeter:me.heliMeter ? true : false, metal:me.metalDet ? true : false
  };
  localStorage.setItem(name, JSON.stringify(state));
  let nameList = getNameList();
  nameList.push(name);
  localStorage.setItem('names', JSON.stringify(nameList));
  message("Game saved as", name, "in your browser");
}//saveGameAs

function loadGame ()
{ if (!storageAvailable('localStorage')) unavail();
  else
  { let nameList = localStorage.getItem('names');
    if (null === nameList)
    { alert("Sorry, there are no saved games");
    }
    else
    { nameList = JSON.parse(nameList);
      let s = "Saved games: ";
      for (let i = 0; i < nameList.length; i++)
      { s += '\n' + (i + 1) + '  ' + nameList [i];
      }
      let req = prompt(s + '\n\nWhich number?');
      if (null !== req && req.length > 0)
      { req = parseInt(req) - 1;
      }
      else return;
      if (req >= 0 && req < nameList.length)
      { let s = localStorage.getItem(nameList[req]);
        let sorry = "Sorry, error loading game";//In case needed
        if (null !== s && s.length > 0)
        { message("Loading previously", "saved game");
          try
          { let me = forest.observer, ft = forest.terrain, fs = forest.scene;
            let state = JSON.parse(s);
            ft.placed = {};//Clear previous objects
            fs.range_m = state.range;
            perhapsSet("range", "" + state.range);
            me.x = state.x; me.y = state.y; me.b = state.b;
            me.sincos();
            // Must set up Around:
            { let fa = forest.around;
              let mex = Math.round(me.x), mey = Math.round(me.y);
              fa.init(mex, mey);
              let rm1 = fs.range_m - 1, furthestI = Math.floor(Math.PI * rm1 * rm1);//ET
              for (let ii = furthestI; ii >= 0; ii--)
              { let xyd = fa.lookupXYD(ii);
                let xScan = xyd.x + mex, xOdd = (xScan & 1 === 1);
                let yScan = xyd.y + mey, yOdd = (yScan & 1 === 1);
                let dScan = xyd.d, bScan = xyd.b;
                if (dScan < 20)
                { let dx = xScan - me.x, dy = yScan - me.y;
                  dScan = Math.sqrt(dx * dx + dy * dy);
                  bScan = Math.atan2(dx, dy) * RAD2DEG;
                }
                let db = bScan - me.b;
                if (db < -180) db += 360;
                else if (db > 180) db -= 360;
                fa.aroundSet(dScan, db, xScan, yScan, xOdd && yOdd);
              }
            }
            me.inHeli = state.heli; me.ht = state.ht;
            me.stride = state.stride;
            perhapsSet("stride", "" + me.stride);
            me.nPieces = state.pieces;
            me.inside = state.inside;
            if (null !== me.inside)
            { if (!Inside.prototype.pics) loadInsidePics();
              let bldg = new Building(me.inside.x, me.inside.y);
              me.inside = (null === bldg) ? null : new Inside(bldg);
              me.building = bldg;// May be null
            }
            ft.bleak = state.bleak;
            ft.lakeHt = state.lakeHt;
            ft.LAKE_HT0 = state.lakeHt0;
            ft.snowHt = state.snowHt;
            forest.tele.sites = state.teles;
            let fts = forest.tele.sites;
            for (let i = 0; i < fts.length; i++)
            { let si = fts[i];
              ft.place(si.x, si.y, FEATURES.T);
              ft.place(si.mx, si.my, FEATURES.METAL);
            }
            ft.PROFILE = state.profile;
            ft.PROFILE_LENGTH = ft.PROFILE.length;
            ft.PROFILE_MASK = ft.PROFILE.length - 1;
            ft.roads = [];
            roadsFromArray(state.roads);
            fs.htBase = state.htBase;
            centreMapOnObserver();
            forest.showing = state.show;
            me.inMine = false; 
            switch (forest.showing)
            { case 'scene':
                showButtons(sceneButtons); forest.scene.draw(); break;
              case 'map':
                showButtons(mapButtons); forest.map.draw(); break;
              case 'mine':
                me.inMine = true;
                showButtons(mineButtons);
                forest.mine.draw();
                break;
              case 'minemap':
                me.inMine = true;
                showButtons(mineMapButtons);
                forest.mineMap.draw();
                break;
              case 'tele':
                showButtons(teleButtons); forest.tele.draw(); break;
              default: message("Unrecognised showing state:", forest.showing);
                       console.log(state.show);
            }
            me.rgbMeter = state.rgb ? new RgbMeter() : null;
            me.heliMeter = state.helimeter ? new HeliMeter() : null;
            me.metalDet = state.metal ? new MetalDetector() : null;
            document.getElementById("orient").checked = false;
            forest.map.changeOrient();
            if (forest.sceneCache) delete forest.sceneCache;
          }
          catch(e) 
          { console.log(e);//SyntaxError
            message(sorry, true);
          }
        }
        else message(sorry, true);
} } } }//loadGame

// From https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) 
{ try 
  { var storage = window[type], x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) 
  { return e instanceof DOMException && (
    e.code === 22 ||
    e.code === 1014 ||
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
    storage.length !== 0;
} }

function unavail() { alert("Local storage is not available in this browser"); }

const EG_JSON =
'{"x":8246,"y":-11199,"b":314,"heli":false,"ht":2,"stride":3,"pieces":0,"htBase":310,"range":100,"inside":null,"teles":[{"x":9283,"y":-10494,"id":"0","sx":380,"sy":340,"wd":48,"ht":32,"mx":9286,"my":-10500},{"x":3889,"y":19994,"id":"A","sx":328,"sy":34,"wd":48,"ht":32,"mx":3880,"my":19990},{"x":2950,"y":9900,"id":"B","sx":293,"sy":126,"wd":48,"ht":32,"mx":2956,"my":9910},{"x":-17800,"y":350,"id":"C","sx":45,"sy":221,"wd":48,"ht":32,"mx":-17807,"my":345},{"x":-15850,"y":-8775,"id":"D","sx":67,"sy":318,"wd":48,"ht":32,"mx":-15848,"my":-8770},{"x":-6925,"y":-10000,"id":"E","sx":171,"sy":394,"wd":48,"ht":32,"mx":-6935,"my":-10010},{"x":9500,"y":-29975,"id":"F","sx":389,"sy":535,"wd":48,"ht":32,"mx":9509,"my":-29970},{"x":18125,"y":-25050,"id":"G","sx":674,"sy":491,"wd":48,"ht":32,"mx":18132,"my":-25057}],"bleak":false,"lakeHt":34,"lakeHt0":34,"profile":[11,10,9,11,7,9,9,5,4,0,-5,-7,-10,-13,-16,-19,-20,-22,-25,-28,-29,-31,-29,-30,-29,-26,-22,-19,-18,-13,-12,-8,-6,-3,1,7,12,19,20,24,25,30,32,34,35,38,37,37,37,40,35,34,31,30,29,28,26,20,18,19,17,18,16,11,7,10,9,10,9,10,8,7,8,6,8,9,14,16,15,15,18,14,15,16,17,21,23,21,21,23,24,28,26,29,30,32,32,34,34,38,38,38,43,40,41,42,39,39,37,34,34,34,29,28,24,19,15,11,9,5,2,-6,-9,-10,-15,-15,-17,-19,-19,-22,-23,-21,-21,-20,-16,-11,-9,-6,1,1,5,12,14,22,22,24,28,31,34,34,35,32,31,29,24,21,20,18,13,9,3,0,-5,-8,-9,-9,-14,-17,-17,-19,-16,-19,-18,-20,-15,-15,-14,-14,-10,-7,-4,-3,0,0,-1,2,5,3,1,1,1,-1,-4,-4,-7,-13,-15,-16,-19,-21,-22,-22,-26,-28,-29,-26,-28,-31,-28,-24,-27,-25,-21,-23,-20,-18,-17,-12,-11,-10,-8,-7,-4,1,-1,0,-1,3,-1,3,2,-1,4,2,0,-1,-1,0,-2,0,-3,-2,-4,-2,-1,-3,-6,-4,-5,-4,-6,-6,-10,-9,-8,-10,-10,-8,-11,-12,-13,-10,-9,-11,-12,-11,-10,-5,-7,-6,-4,-2,-3,2,6,8,10,12,14,18,19,21,23,21,21,23,23,23,21,16,13,12,3,1,1,-9,-14,-18,-24,-29,-33,-39,-42,-47,-51,-52,-53,-57,-56,-57,-56,-55,-52,-53,-47,-44,-42,-39,-35,-32,-27,-24,-18,-15,-14,-13,-11,-9,-4,-4,-4,-1,1,-4,-1,0,-3,-2,-2,-5,-6,-4,-5,-5,-5,-4,-3,-3,-3,1,2,2,6,8,11,13,17,20,23,24,24,25,25,26,26,27,26,25,25,25,23,19,16,16,13,13,9,5,5,-1,-2,-1,-6,-10,-10,-13,-13,-14,-12,-10,-10,-7,-8,-6,-3,0,4,6,10,13,18,21,26,27,29,33,39,41,41,47,50,52,54,51,55,55,58,59,59,57,60,59,58,57,51,52,51,54,49,47,45,42,41,38,36,35,31,31,29,26,24,22,20,16,15,12,15,15,12,11,9,5,8,8,9,10,9,11,14,16,19,21,21,27,29,30,36,40,40,42,43,46,46,48,47,46,47,49,47,43,42,38,32,29,23,18,13,6,1,-1,-6,-12,-15,-18,-22,-26,-27,-30,-27,-29,-25,-24,-21,-16,-13,-9,-6,-1,3,10,14,16,24,25,31,32,37,38,37,34,35,35,30,30,26,23,18,12,7,1,-4,-5,-12,-16,-18,-24,-29,-29,-32,-34,-36,-34,-35,-32,-30,-29,-25,-22,-23,-21,-17,-10,-6,-6,-1,3,8,18,17,21,23,23,26,28,32,33,33,36,41,38,39,38,37,37,38,35,33,31,31,25,23,22,19,15,9,7,-1,-6,-12,-18,-22,-23,-31,-35,-41,-46,-47,-50,-53,-58,-58,-61,-61,-62,-58,-58,-57,-54,-47,-47,-40,-39,-32,-31,-24,-23,-20,-13,-10,-7,-5,-1,0,2,5,4,3,6,2,2,1,-2,-2,-6,-9,-9,-11,-14,-14,-17,-17,-18,-20,-25,-22,-25,-26,-25,-23,-30,-31,-30,-29,-30,-32,-34,-36,-37,-42,-41,-43,-44,-46,-50,-46,-48,-51,-48,-51,-49,-50,-50,-45,-44,-43,-39,-37,-34,-28,-24,-22,-14,-14,-10,-6,-1,-1,3,5,7,4,6,2,1,-1,-2,-6,-14,-13,-17,-25,-29,-34,-37,-45,-48,-53,-54,-58,-61,-60,-63,-63,-61,-59,-57,-57,-51,-48,-44,-39,-31,-24,-22,-14,-12,-4,1,4,6,13,17,18,15,18,17,13,14,12,9,5,4,2,1,-1,-10,-15,-15,-19,-22,-22,-22,-27,-28,-30,-27,-30,-28,-26,-24,-20,-17,-15,-15,-12,-12,-8,-1,0,0,2,6,8,8,12,11,13,14,14,14,13,10,13,11,10,6,6,2,2,2,-5,-4,-7,-10,-10,-16,-15,-20,-16,-16,-17,-18,-21,-19,-17,-19,-17,-18,-13,-15,-12,-9,-10,-7,-5,-3,-5,-1,1,5,7,9,10,9,15,20,19,21,20,20,23,24,24,26,23,23,27,22,21,22,19,16,17,14,11,10,9,11,7,5,1,0,-4,-6,-7,-6,-8,-8,-8,-8,-8,-6,-5,-3,0,4,3,7,8,11,16,19,18,22,25,29,31,30,33,34,35,37,36,39,38,37,37,37,36,33,33,32,28,26,24,25,26,26,23,23,24,23,25,29,28,30,31,35,37,39,43,44,44,48,47,48,47,47,48,44,45,45,41,39,39,33,30,25,18,15,16,7,8,3,0,-3,-2,-6,-6,-4,-5,-6,-4,-5,0,4,5,10,12,11,19,21,25,27,26,30,34,36,38,36,40,38,40,39,36,37,37,38,37,34,31,29,25,24,20,16,16,16,13,10,5,3,-1,-4,-3,-6,-6,-12,-14,-15,-19,-20,-20,-24,-25,-29,-28,-31,-29,-32,-30,-29,-31,-30,-27,-27,-27,-23,-21,-18,-16,-16,-11,-12,-8,-6,-8,-6,-5,-4,-4,-5,-6,-6,-11,-10,-15,-15,-17,-21,-25,-29,-28,-30,-33,-37,-38,-37,-40,-37,-34,-36,-31,-30,-27,-25,-21,-16,-11,-6,-2,3,8,9,10,18,18,21,23,23,24,19,18,20,15,14,8,4,1,-2,-9,-9,-13,-16,-17,-22,-23,-20,-23,-20,-20,-16,-14,-9,-5,-2,2,5,11,16,23,28,29,36,38,41,44,46,44,45,44,42,43,39,36,28,27,16,15,13,7,1,-3,-9,-14,-16,-18,-25,-28,-28,-28,-30,-26,-30,-24,-24,-21,-18,-17,-14,-9,-5,-3,4,10,10,13,16,18,23,27,25,29,27,28,30,27,28,27,25,27,23,19,18,17,11,9,6,2,-3,-3,-6,-11,-13,-17,-20,-24,-28,-28,-32,-36,-37,-36,-40,-41,-38,-41,-43,-40,-39,-40,-40,-35,-33,-29,-30,-25,-18,-17,-13,-8,-3,3,9,12,15,20,22,29,33,36,36,36,43,44,41,42,40,39,38,37,35,31,29,23,21,20,14,5,1,-3,-8,-11,-13,-18,-22,-24,-30,-33,-36,-38,-39,-42,-42,-39,-35,-33,-33,-30,-28,-23,-22,-17,-16,-10,-7,0,5,5,12,19,19,19,25,28,31,30,36,36,37,39,40,36,38,35,36,36,34,33,33,30,26,23,24,24,20,18,17,18,14,12,8,11,10,5,6,7,5,4,1,0,1,-1,0,-2,-2,1,2,2,2,2,4,6,8,9,5,13,9,11,11,9,13,13,14,11,10,7,7,3,1,0,-4,-8,-13,-13,-19,-20,-23,-27,-30,-31,-35,-40,-41,-44,-45,-42,-43,-41,-42,-34,-37,-33,-28,-25,-20,-18,-11,-10,-5,1,3,8,10,12,19,19,22,21,16,17,18,18,19,16,16,9,9,7,2,3,-5,-5,-9,-10,-14,-14,-12,-15,-15,-19,-18,-21,-20,-18,-17,-19,-18,-16,-19,-16,-17,-19,-15,-15,-21,-20,-18,-19,-23,-19,-19,-17,-19,-16,-19,-16,-12,-10,-7,-7,0,2,6,8,9,12,18,21,20,22,22,22,21,22,23,20,19,11,9,5,-1,-5,-11,-14,-22,-26,-31,-37,-47,-48,-47,-51,-51,-54,-51,-50,-49,-47,-42,-39,-36,-29,-27,-21,-12,-9,-2,4,9,17,23,23,26,26,30,30,30,31,28,25,23,22,19,13,9,8,2,-3,-8,-13,-13,-18,-18,-23,-25,-25,-25,-25,-24,-28,-24,-22,-24,-21,-18,-20,-18,-19,-14,-17,-15,-17,-15,-14,-14,-16,-15,-13,-16,-21,-20,-19,-21,-20,-24,-25,-24,-28,-30,-31,-34,-31,-31,-35,-32,-31,-30,-29,-31,-34,-33,-27,-28,-28,-28,-28,-25,-25,-24,-23,-22,-25,-22,-19,-17,-16,-18,-14,-13,-10,-8,-13,-11,-12,-9,-8,-8,-8,-6,-7,-7,-12,-6,-10,-6,-7,-10,-10,-9,-7,-12,-13,-17,-17,-18,-18,-18,-19,-17,-20,-18,-17,-17,-15,-15,-12,-12,-8,-7,-3,0,1,10,9,12,15,19,20,25,25,27,29,33,35,32,35,37,35,33,33,32,30,28,24,21,21,17,15,14,11,8,7,8,4,3,-1,2,2,2,3,2,3,3,4,7,10,9,10,13,16,17,20,17,19,23,20,22,25,24,23,24,24,22,17,22,16,14,15,15,15,16,12,9,9,10,10,11,10,7,12,11,11,14,17,18,21,22,26,28,30,33,34,35,41,42,44,44,44,46,43,46,47,47,44,42,39,38,37,33,31,28,26,24,20,16,18,14,12,11,7,3,5,3,2,2,2,-3,-1,-2,-4,-2,-1,-1,-3,-1,-2,1,1,2,3,6,8,9,10,9,11,13,17,15,23,25,30,34,33,37,38,38,40,44,46,45,48,48,51,49,48,47,46,45,43,38,38,37,33,32,28,29,23,20,23,19,25,18,20,20,23,22,22,27,30,30,30,34,34,37,41,41,40,40,34,37,34,32,30,24,20,16,10,7,-5,-8,-12,-18,-25,-28,-31,-35,-36,-38,-38,-36,-34,-34,-35,-34,-25,-20,-14,-6,-1,6,12,20,27,32,37,41,47,51,49,50,51,49,48,43,40,37,31,25,19,11,3,-5,-15,-19,-26,-33,-41,-48,-55,-59,-64,-64,-71,-72,-72,-74,-71,-69,-67,-64,-63,-60,-55,-50,-45,-40,-35,-32,-25,-23,-17,-13,-9,-6,-2,2,3,6,10,14,12,16,16,18,17,15,16,16,13,11,10,11,6,5,4,2,1,-1,-9,-10,-11,-14,-17,-23,-24,-29,-30,-31,-31,-39,-38,-35,-37,-36,-34,-34,-34,-31,-30,-26,-19,-17,-14,-11,-11,-3,0,2,7,9,13,13,13,14,16,16,19,14,13,15,12,16,11,7,3,-1,-3,-5,-4,-9,-12,-15,-20,-21,-22,-23,-24,-25,-26,-28,-30,-30,-31,-34,-32,-33,-32,-32,-29,-34,-32,-29,-31,-29,-31,-31,-32,-32,-28,-28,-26,-26,-22,-24,-18,-17,-16,-11,-11,-8,-5,-4,1,1,3,4,4,6,8,6,7,10,5,3,3,0,-3,-4,-10,-12,-16,-19,-23,-28,-36,-40,-43,-45,-46,-51,-55,-54,-56,-61,-59,-54,-57,-55,-51,-53,-45,-42,-38,-36,-33,-28,-24,-20,-14,-10,-7,-2,0,3,8,10],"snowHt":144,"roads":[{"path":[{"x":8395,"y":-11029},{"x":8438,"y":-11020}]},{"path":[{"x":8492,"y":-10990},{"x":8500,"y":-10914},{"x":8505,"y":-10892},{"x":8503,"y":-10875}]},{"path":[{"x":8492,"y":-11003},{"x":8511,"y":-11025}]},{"path":[{"x":8632,"y":-10990},{"x":8681,"y":-10986},{"x":8776,"y":-10978}]},{"path":[{"x":8792,"y":-10982},{"x":8869,"y":-11056}]},{"path":[{"x":9056,"y":-10729},{"x":9080,"y":-10756}]}],"show":"map","rgb":false,"helimeter":false,"metal":false}';
